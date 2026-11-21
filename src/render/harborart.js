// Pastel Harbor (its makeover, 2026-11-21): a landmark for each district, nothing more (the town
// rule: clean and spacious, no prop clutter). Behind the square, the Harbor Clock: a tall pastel
// clock tower with a copper-green spire and a golden fish for a weather vane, its hands keeping the
// player's own clock (the one day and night follow), its bells swinging as they ring the hour
// (audio/listen.js hearClock). In the Fish Market, the market mast: a tall striped pole, a big painted wooden fish hanging
// from its yard and swinging in the sea breeze, bunting strung down from its top.
import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';

const HB = {
  wall: '#ffe8e0', wallLit: '#fff6f2', wallSh: '#f2cfc8', trim: '#ffffff', trimSh: '#e8dcec',
  spire: '#7fc8b8', spireLit: '#a8e4d4', spireSh: '#5aa898', gold: '#ffd05a', goldSh: '#e0a83a',
  clock: '#fffaf0', ink: '#4a3a5c', window: '#8fc8f2', windowLit: '#c8e8ff', door: '#8fd8c0',
  stone: '#f4f0ec', stoneSh: '#d8d0d4',
  red: '#ff8a8a', redSh: '#e06a74', pole: '#ffffff', poleBand: '#5fc8d8', wood: '#e8b880', woodSh: '#c08a5a',
  fish: '#ff9ec0', fishLit: '#ffd0e0', fishSh: '#e07a9a', fin: '#5fc8d8',
};
const R = (x0, y0, x1, y1, c) => T([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c);
const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
// (`k` draws the piece smaller than it is laid out, the clock tower sized to stand behind the square.)
const scaled = (k) => (sh) => (k === 1 ? sh : sh.pts
  ? { ...sh, x: sh.x * k, y: sh.y * k, pts: sh.pts.map(([px, py]) => [px * k, py * k]) }
  : { ...sh, x: sh.x * k, y: sh.y * k, rx: sh.rx * k, ry: sh.ry * k });
function art(key, w, h, build, k = 1) {
  return sprite(`hb|${key}`, () => ({ w: Math.round(w * k) + M * 2, h: Math.round(h * k) + M, shapes: build().filter(Boolean).map(scaled(k)).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}

// ---------- The Harbor Clock (behind the square) ----------
const CT_W = 96;
const CT_H = 330; // laid out this tall (the vane at the very top), drawn at CT_K
const CT_K = 0.7;
const CT_FACE = 178; // the clock face's middle, up from the foot (laid out)
function clockArt() {
  return art('clock', CT_W, CT_H, () => {
    const cx = CT_W / 2;
    const H = CT_H;
    const out = [];
    // The base: a wider stone plinth with an arched door.
    out.push(R(cx - 40, H - 46, cx + 40, H, HB.stone), F(R(cx - 40, H - 46, cx + 40, H - 42, HB.trim)), F(R(cx + 22, H - 46, cx + 40, H, HB.stoneSh)));
    out.push(T([[cx - 11, H], [cx - 11, H - 24], ...arc(cx, H - 24, 11, 11, 180, 360, 8), [cx + 11, H]], HB.door), F(R(cx - 0.6, H - 34, cx + 0.6, H, '#6fb8a0')));
    // The shaft: pink plaster, white corner quoins, two tall windows.
    out.push(R(cx - 30, H - 220, cx + 30, H - 46, HB.wall), F(R(cx + 14, H - 220, cx + 30, H - 46, HB.wallSh)), F(R(cx - 30, H - 220, cx - 24, H - 46, HB.wallLit)));
    for (let y = H - 210; y < H - 50; y += 14) out.push(F(R(cx - 32, y, cx - 26, y + 9, HB.trim)), F(R(cx + 26, y, cx + 32, y + 9, HB.trimSh)));
    for (const wy of [H - 92, H - 150]) out.push(T([[cx - 8, wy + 22], [cx - 8, wy + 6], ...arc(cx, wy + 6, 8, 8, 180, 360, 8), [cx + 8, wy + 22]], HB.window), F(R(cx - 0.6, wy, cx + 0.6, wy + 22, HB.trim)), F(R(cx - 8, wy + 12, cx + 8, wy + 13, HB.trim)));
    // The clock: a white face in a gold ring, hour marks (the hands are drawn live).
    const fy = H - CT_FACE;
    out.push(E(cx, fy, 22, 22, HB.gold), E(cx, fy, 18.4, 18.4, HB.clock), F(E(cx - 6, fy - 7, 8, 5, '#ffffff')));
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      out.push(F(E(cx + Math.cos(a) * 15, fy + Math.sin(a) * 15, k % 3 ? 0.9 : 1.6, k % 3 ? 0.9 : 1.6, HB.ink)));
    }
    // The belfry: an open arch with a balcony rail (the bells hang in it, drawn live).
    out.push(R(cx - 32, H - 250, cx + 32, H - 220, HB.wall), F(R(cx + 16, H - 250, cx + 32, H - 220, HB.wallSh)));
    out.push(T([[cx - 18, H - 220], [cx - 18, H - 236], ...arc(cx, H - 236, 18, 12, 180, 360, 10), [cx + 18, H - 220]], '#5a4a6a'));
    out.push(R(cx - 34, H - 222, cx + 34, H - 218, HB.trim));
    for (let x = cx - 30; x <= cx + 30; x += 6) out.push(F(R(x, H - 230, x + 1.6, H - 222, HB.trim)));
    // The spire: copper green, a gold ball and a fish for a vane.
    out.push(R(cx - 36, H - 254, cx + 36, H - 248, HB.trim));
    out.push(T([[cx - 34, H - 252], [cx, H - 302], [cx + 34, H - 252]], HB.spire), F(T([[cx, H - 302], [cx + 34, H - 252], [cx, H - 252]], HB.spireSh)), F(T([[cx - 26, H - 254], [cx - 3, H - 292], [cx - 12, H - 254]], HB.spireLit)));
    out.push(E(cx, H - 304, 3.4, 3.4, HB.gold), R(cx - 0.8, H - 318, cx + 0.8, H - 304, HB.goldSh));
    out.push(T([[cx - 10, H - 320], [cx + 4, H - 324], [cx + 10, H - 320], [cx + 4, H - 316]], HB.gold), T([[cx - 10, H - 320], [cx - 15, H - 325], [cx - 15, H - 315]], HB.goldSh));
    return out;
  }, CT_K);
}
// Its hands (`clock`: the time of day in minutes, world/daytime.js) and two bells that swing and
// settle as they ring the hour.
function drawClock(ctx, x, y, time, seed, wx, night, clock = 0) {
  place(ctx, clockArt(), x, y);
  const k = CT_K;
  const fy = y - CT_FACE * k;
  const hours = (clock / 60) % 12;
  ctx.strokeStyle = HB.ink;
  ctx.lineCap = 'round';
  for (const [len, w, turn] of [[9, 2, hours / 12], [14, 1.3, hours % 1]]) {
    const a = turn * Math.PI * 2 - Math.PI / 2;
    ctx.lineWidth = w * k;
    ctx.beginPath();
    ctx.moveTo(x, fy);
    ctx.lineTo(x + Math.cos(a) * len * k, fy + Math.sin(a) * len * k);
    ctx.stroke();
  }
  ctx.fillStyle = HB.gold;
  ctx.beginPath();
  ctx.arc(x, fy, 1.8 * k, 0, Math.PI * 2);
  ctx.fill();
  // The bells: a peal for a few seconds as each hour comes round, easing to stillness.
  const since = (clock % 60) * 60;
  const swing = since < 6 ? Math.sin(since * 6) * 0.5 * (1 - since / 6) : 0;
  for (const [dx, s] of [[-7, k], [7, 0.8 * k]]) {
    ctx.save();
    ctx.translate(x + dx * k, y - 248 * k);
    ctx.rotate(swing * (dx < 0 ? 1 : -1));
    ctx.fillStyle = HB.gold;
    ctx.beginPath();
    ctx.moveTo(-5 * s, 12 * s);
    ctx.quadraticCurveTo(-5 * s, 0, 0, 0);
    ctx.quadraticCurveTo(5 * s, 0, 5 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = HB.goldSh;
    ctx.fillRect(-5.6 * s, 11 * s, 11.2 * s, 1.4);
    ctx.restore();
  }
}

// ---------- The Fish Market's mast ----------
const FM_W = 70;
const FM_H = 250;
function mastArt() {
  return art('mast', FM_W, FM_H, () => {
    const cx = FM_W / 2;
    const H = FM_H;
    const out = [];
    // A stone foot, the striped pole, the yard across near the top, a gold ball.
    out.push(T([[cx - 12, H], [cx + 12, H], [cx + 9, H - 12], [cx - 9, H - 12]], HB.stone), F(R(cx + 3, H - 12, cx + 12, H, HB.stoneSh)));
    out.push(R(cx - 3, H - 236, cx + 3, H - 12, HB.pole), F(R(cx + 1, H - 236, cx + 3, H - 12, HB.trimSh)));
    for (let y = H - 230; y < H - 20; y += 22) out.push(T([[cx - 3, y + 6], [cx + 3, y], [cx + 3, y + 6], [cx - 3, y + 12]], HB.poleBand));
    out.push(R(cx - 26, H - 200, cx + 26, H - 196, HB.woodSh), F(R(cx - 26, H - 200, cx + 26, H - 199, HB.wood)));
    out.push(E(cx, H - 240, 4.4, 4.4, HB.gold), F(E(cx - 1.4, H - 241.4, 1.4, 1.4, '#fff3c8')));
    return out;
  });
}
// The fish sign: a big painted wooden fish, hung from the yard on two cords.
function fishSignArt() {
  return art('fishsign', 60, 34, () => [
    T([[2, 17], [12, 6], [30, 3], [46, 8], [52, 17], [46, 26], [30, 31], [12, 28]], HB.fish),
    F(T([[12, 10], [30, 6], [44, 10], [30, 14], [14, 15]], HB.fishLit)),
    F(T([[14, 24], [30, 28], [44, 24], [30, 22]], HB.fishSh)),
    T([[50, 17], [60, 6], [58, 17], [60, 28]], HB.fin),
    T([[24, 4], [32, -2], [36, 5]], HB.fin),
    F(E(14, 14, 2.6, 2.6, '#ffffff')), F(E(14.6, 14.4, 1.4, 1.4, HB.ink)),
    ...[22, 30, 38].map((x) => F(T(arc(x, 17, 3, 4, 270, 450, 6), HB.fishSh))),
  ]);
}
function drawMast(ctx, x, y, time, seed, wx) {
  place(ctx, mastArt(), x, y);
  const yard = y - 198;
  // Bunting from the top down to either side, its flags stirring.
  for (const side of [-1, 1]) {
    const x0 = x;
    const y0 = y - 232;
    const x1 = x + side * 64;
    const y1 = y - 120;
    ctx.strokeStyle = '#e8dcec';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 14, x1, y1);
    ctx.stroke();
    for (let k = 1; k < 8; k++) {
      const u = k / 8;
      const px = x0 + (x1 - x0) * u;
      const py = y0 + (y1 - y0) * u + 14 * 2 * u * (1 - u);
      ctx.fillStyle = ['#ff9ec0', '#ffe36b', '#8fd8ff', '#9fe0a0'][(k + (side > 0 ? 2 : 0)) % 4];
      ctx.beginPath();
      ctx.moveTo(px - 3, py);
      ctx.lineTo(px + 3, py);
      ctx.lineTo(px + Math.sin(time * 3 + k + wx * 0.01) * 0.8, py + 6);
      ctx.fill();
    }
  }
  // The fish, swinging gently from the yard on its cords.
  const sw = Math.sin(time * 1.1 + wx * 0.01) * 0.07;
  ctx.save();
  ctx.translate(x, yard + 2);
  ctx.rotate(sw);
  ctx.strokeStyle = HB.woodSh;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-12, 14);
  ctx.moveTo(14, 0);
  ctx.lineTo(12, 14);
  ctx.stroke();
  place(ctx, fishSignArt(), 0, 48 + 30);
  ctx.restore();
}

export const HARBOR_KINDS = {
  // (Behind the square, set back in the haze: not in scenery's MEETS_LEDGE.)
  harborclock: { w: Math.round(CT_W * CT_K) + M * 2, h: Math.round(CT_H * CT_K) + M, draw: drawClock },
  fishmast: { w: FM_W + M * 2, h: FM_H + M, draw: drawMast },
};
