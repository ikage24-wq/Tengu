// Twilight Ruins (its makeover, 2026-11-20): a smaller sunken temple at dusk, built round three
// landmarks, the way Mossy Woods is built round its giant trees. In the west the old bell tower,
// its balconies stepping up round it to the belfry where you arrive from Moonleaf Grove, the bell
// still swinging; in the middle the Moon Maiden, a giant sleeping statue on her plinth in the
// crypt, one forearm held across her (a ledge) and a lantern held up in the other hand beside the
// column of wisp-light; in the east a portico whose floors have fallen in, a rose window glowing
// behind them, the way to the Fox Shrine Path leaving from its far pillar. Its ledges are carved
// temple slabs ('temple'), mossy, with vines hanging off them; behind it all, a lilac dusk with a
// big moon over the domes and broken colonnades of the rest of the temple.

import { E, T, F, sprite, blit, snap, mix, shade } from './pixel.js';
import { band } from './propkit.js';
import { windAt } from './terrain.js';

export const RA = {
  stone: '#c6b8d8', lit: '#e6dcf0', sh: '#9c8cb8', deep: '#6e5e90', line: '#584a7c', course: '#b2a2c8',
  moss: '#8acb9c', mossLit: '#bfe8b6', mossSh: '#5f9f7e', ivy: '#5aa67a', ivyLit: '#86c896',
  win: '#3c3058', winIn: '#54467a', glow: '#ffe2a0', roof: '#8c78ba', roofLit: '#ac98d4', roofSh: '#6c5a98',
  gold: '#efe0b4', goldLit: '#fff4d6', bell: '#e6be6a', bellLit: '#fbe2a0', bellSh: '#b08a44',
  blush: '#efbcd4', rose: '#ffd6a8',
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
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`ra|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// An arched window (a dark opening, its sill and a dim glow inside).
function archWindow(out, cx, top, w, h) {
  const r = w / 2;
  out.push(T([...arc(cx, top + r, r, r, 180, 360, 10), [cx + r, top + h], [cx - r, top + h]], RA.win));
  out.push(F(E(cx, top + h * 0.62, r * 0.55, h * 0.26, RA.winIn)));
  out.push(F(T(rect(cx - r - 3, top + h, cx + r + 3, top + h + 3.5), RA.lit)));
}
// Moss in a little clump, and ivy climbing a path.
function moss(out, x, y, s) {
  out.push(F(E(x, y, 9 * s, 4 * s, RA.mossSh)), F(E(x - 2 * s, y - 1.5 * s, 7 * s, 3.2 * s, RA.moss)), F(E(x - 4 * s, y - 2.6 * s, 3.4 * s, 1.5 * s, RA.mossLit)));
}
function ivy(out, path, seed) {
  out.push(F(band(path, () => 1.1, RA.ivy)));
  path.forEach(([x, y], i) => {
    if (i % 2) return;
    const s = h01(seed + i) > 0.5 ? 1 : -1;
    out.push(F(E(x + s * 4, y, 4, 2.6, i % 4 ? RA.ivy : RA.ivyLit)));
  });
}

// ---------- The bell tower: a tall square tower of lilac stone, an arched door at its foot and
// windows up its face, its belfry open on four pillars under a broken pointed roof. Bottom middle
// on the crypt floor; the belfry floor is 150 below the top of the picture. ----------
const TW_W = 200;
const TW_H = 890;
function towerArt() {
  const W = TW_W;
  const H = TW_H;
  const cx = W / 2;
  return art('tower', W, H, () => {
    const out = [];
    const top = 160;
    // The plinth and the shaft, lit down its west side.
    out.push(T([[cx - 96, H + 4], [cx - 96, H - 30], [cx - 88, H - 44], [cx + 88, H - 44], [cx + 96, H - 30], [cx + 96, H + 4]], RA.stone));
    out.push(F(T([[cx - 94, H - 30], [cx - 86, H - 42], [cx - 56, H - 42], [cx - 62, H - 30]], RA.lit)), F(T(rect(cx - 96, H - 30, cx + 96, H - 26), RA.sh)));
    out.push(T([[cx - 74, H - 44], [cx - 68, top], [cx + 68, top], [cx + 74, H - 44]], RA.stone));
    out.push(F(T([[cx - 72, H - 44], [cx - 66, top], [cx - 48, top], [cx - 52, H - 44]], RA.lit)), F(T([[cx + 73, H - 44], [cx + 67, top], [cx + 50, top], [cx + 54, H - 44]], RA.sh)));
    // Its courses of blocks.
    for (let y = H - 70, r = 0; y > top + 14; y -= 26, r++) {
      const hw = 74 - ((H - 44 - y) / (H - 44 - top)) * 6;
      out.push(F(T(rect(cx - hw + 2, y, cx + hw - 2, y + 1.3), RA.course)));
      for (let k = 0; k < 5; k++) {
        const jx = cx - hw + 14 + k * 30 + (r % 2) * 15;
        if (jx < cx + hw - 8) out.push(F(T(rect(jx, y + 1.3, jx + 1.2, y + 26), RA.course)));
      }
    }
    // The door at its foot and two windows up its face.
    out.push(T([...arc(cx, H - 104, 22, 22, 180, 360, 10), [cx + 22, H - 44], [cx - 22, H - 44]], RA.win));
    out.push(F(T([...arc(cx, H - 104, 15, 15, 180, 360, 8), [cx + 15, H - 44], [cx - 15, H - 44]], '#2c2244')));
    archWindow(out, cx, 318, 26, 40);
    archWindow(out, cx, 558, 26, 40);
    // A crack, ivy up the west side, moss on the plinth.
    out.push(F(band([[cx + 38, 420], [cx + 30, 446], [cx + 40, 470], [cx + 28, 500], [cx + 34, 530]], (u) => 1.4 - u * 0.6, RA.deep)));
    ivy(out, Array.from({ length: 16 }, (_, i) => [cx - 64 + Math.sin(i * 0.9) * 6, H - 50 - i * 22]), 3);
    moss(out, cx - 70, H - 44, 1.2);
    moss(out, cx + 60, H - 44, 1);
    // The belfry: a cornice under it, four pillars (two show) round the opening, a cornice on top.
    out.push(T(rect(cx - 84, top - 10, cx + 84, top + 2), RA.stone), F(T(rect(cx - 84, top - 10, cx + 84, top - 7), RA.lit)));
    out.push(T([...arc(cx, 106, 50, 30, 180, 360, 12), [cx + 50, top - 10], [cx - 50, top - 10]], '#4a3c6c'));
    out.push(T(rect(cx - 70, 74, cx - 50, top - 10), RA.stone), T(rect(cx + 50, 74, cx + 70, top - 10), RA.stone));
    out.push(F(T(rect(cx - 70, 74, cx - 64, top - 10), RA.lit)), F(T(rect(cx + 63, 74, cx + 70, top - 10), RA.sh)));
    out.push(T(rect(cx - 86, 62, cx + 86, 76), RA.stone), F(T(rect(cx - 86, 62, cx + 86, 65), RA.lit)));
    // The pointed roof, broken open at its top, its tiles in rows and a rafter showing.
    out.push(T([[cx - 88, 64], [cx - 44, 22], [cx - 8, -16], [cx + 4, -6], [cx + 14, -14], [cx + 32, 6], [cx + 88, 64]], RA.roof));
    out.push(F(T([[cx - 86, 62], [cx - 44, 22], [cx - 8, -14], [cx - 16, 8], [cx - 52, 48]], RA.roofLit)));
    for (const [y0, hw] of [[50, 74], [34, 56], [18, 36]]) out.push(F(band(arc(cx, y0 - 10, hw, 10, 20, 160, 8), () => 0.9, RA.roofSh)));
    out.push(F(band([[cx + 4, -4], [cx + 18, 22]], () => 1.6, RA.deep)), F(band([[cx + 14, -12], [cx + 30, 18]], () => 1.4, RA.deep)));
    moss(out, cx - 60, 62, 0.9);
    return out;
  });
}
function drawTower(ctx, x, y, time, seed, wx, night = 0) {
  place(ctx, towerArt(), x, y);
  // The bell, swinging gently under the belfry's arch.
  const hx = x;
  const hy = y - TW_H + 86;
  const a = Math.sin(time * 1.3 + 0.4) * 0.16;
  ctx.save();
  ctx.translate(snap(hx), snap(hy));
  ctx.rotate(a);
  ctx.fillStyle = RA.deep;
  ctx.fillRect(-1, 0, 2, 7);
  ctx.fillStyle = RA.bell;
  ctx.strokeStyle = shade(RA.bellSh, -20);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.quadraticCurveTo(-10, 8, -11, 18);
  ctx.quadraticCurveTo(-12, 28, -16, 32);
  ctx.lineTo(16, 32);
  ctx.quadraticCurveTo(12, 28, 11, 18);
  ctx.quadraticCurveTo(10, 8, 6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = RA.bellLit;
  ctx.fillRect(-8, 12, 3, 16);
  ctx.fillStyle = RA.bellSh;
  ctx.fillRect(-15, 29, 30, 3);
  ctx.beginPath();
  ctx.arc(Math.sin(time * 1.3) * 3, 34, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // At dusk and night the windows glow.
  if (night > 0.05) {
    for (const wy of [318, 558]) {
      const gy = y - TW_H + wy + 24;
      const g = ctx.createRadialGradient(x, gy, 2, x, gy, 26);
      g.addColorStop(0, hexA(RA.glow, 0.45 * night));
      g.addColorStop(1, hexA(RA.glow, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 26, gy - 26, 52, 52);
    }
  }
}

// ---------- The Moon Maiden: a giant statue of a robed maiden asleep on her feet on a plinth
// carved with the moon's phases. One forearm is held level across her (a ledge, drawn here: `bare`
// in the map), the other hand raised to hold up a lantern by her head; a crescent-moon crown (a
// ledge too) on her waved hair; moss on her shoulders. Bottom middle on the crypt floor. ----------
const MM_W = 320;
const MM_H = 740;
function maidenArt() {
  const W = MM_W;
  const H = MM_H;
  const cx = W / 2;
  return art('maiden', W, H, () => {
    const out = [];
    // The plinth, the moon's phases carved along it.
    out.push(T([[cx - 140, H + 4], [cx - 140, H - 58], [cx - 128, H - 80], [cx + 128, H - 80], [cx + 140, H - 58], [cx + 140, H + 4]], RA.stone));
    out.push(F(T([[cx - 138, H - 58], [cx - 127, H - 78], [cx - 90, H - 78], [cx - 98, H - 58]], RA.lit)), F(T(rect(cx - 140, H - 58, cx + 140, H - 54), RA.sh)));
    [-2, -1, 0, 1, 2].forEach((k) => {
      const px = cx + k * 44;
      const py = H - 30;
      out.push(F(E(px, py, 9, 9, RA.sh)), F(E(px, py, 7, 7, RA.lit)));
      if (k) out.push(F(E(px + k * 3.5, py, 6.4, 7, RA.sh)));
    });
    // Her robe, falling straight in folds and pooling a little on the plinth.
    const robe = [[cx - 116, H - 80], [cx - 100, H - 210], [cx - 82, H - 330], [cx - 68, H - 420], [cx - 80, H - 532], [cx - 60, H - 566], [cx + 60, H - 566], [cx + 80, H - 532], [cx + 72, H - 420], [cx + 86, H - 330], [cx + 102, H - 210], [cx + 118, H - 80]];
    out.push(T(robe, RA.stone));
    out.push(F(T([[cx - 112, H - 82], [cx - 96, H - 210], [cx - 78, H - 330], [cx - 64, H - 420], [cx - 76, H - 530], [cx - 56, H - 562], [cx - 34, H - 562], [cx - 46, H - 420], [cx - 60, H - 330], [cx - 76, H - 210], [cx - 90, H - 82]], RA.lit)));
    out.push(F(T([[cx + 114, H - 82], [cx + 98, H - 210], [cx + 82, H - 330], [cx + 68, H - 420], [cx + 76, H - 530], [cx + 58, H - 560], [cx + 48, H - 530], [cx + 54, H - 420], [cx + 66, H - 330], [cx + 80, H - 210], [cx + 94, H - 82]], RA.sh)));
    for (let k = -3; k <= 3; k++) out.push(F(band([[cx + k * 16, H - 380], [cx + k * 22 + Math.sin(k) * 4, H - 240], [cx + k * 30, H - 86]], (u) => 0.9 + u * 0.9, RA.sh)));
    for (let k = -5; k <= 5; k++) out.push(F(E(cx + k * 21, H - 82, 10, 4, k % 2 ? RA.sh : RA.stone)));
    // Drapery over her chest, a neckline, and a sash under her folded arm with its end hanging.
    out.push(F(band([[cx - 42, H - 558], [cx - 26, H - 496], [cx - 12, H - 418]], (u) => 1.6 - u * 0.6, RA.sh)), F(band([[cx + 42, H - 554], [cx + 28, H - 488], [cx + 14, H - 418]], (u) => 1.6 - u * 0.6, RA.sh)));
    out.push(F(band([[cx - 24, H - 566], [cx, H - 538], [cx + 24, H - 566]], () => 1.2, RA.sh)));
    out.push(T(rect(cx - 70, H - 374, cx + 74, H - 362), RA.stone), F(T(rect(cx - 70, H - 366, cx + 74, H - 362), RA.sh)));
    out.push(F(band([[cx + 34, H - 362], [cx + 40, H - 320], [cx + 34, H - 270]], (u) => 5 - u * 2, RA.sh)), F(band([[cx + 46, H - 362], [cx + 54, H - 330], [cx + 52, H - 290]], (u) => 4 - u * 2, RA.sh)));
    moss(out, cx - 84, H - 260, 0.9);
    moss(out, cx + 92, H - 190, 0.8);
    // The forearm held level across her (its top is the ledge), the sleeve hanging under it.
    out.push(T([[cx - 100, H - 384], [cx - 32, H - 384], [cx - 50, H - 322], [cx - 84, H - 312], [cx - 106, H - 344]], RA.stone));
    out.push(F(band([[cx - 92, H - 376], [cx - 80, H - 330]], () => 1, RA.sh)), F(band([[cx - 66, H - 378], [cx - 62, H - 326]], () => 1, RA.sh)));
    out.push(T([[cx - 104, H - 400], [cx + 52, H - 400], [cx + 58, H - 392], [cx + 52, H - 382], [cx - 104, H - 382]], RA.stone), F(T(rect(cx - 102, H - 400, cx + 50, H - 397), RA.lit)));
    out.push(E(cx + 60, H - 391, 10, 9, RA.stone));
    out.push(F(band([[cx - 72, H - 536], [cx - 94, H - 470], [cx - 100, H - 404]], (u) => 9 - u * 2, RA.stone)));
    // The other arm raised, the lantern hung from her hand by her head.
    out.push(band([[cx + 72, H - 536], [cx + 108, H - 582], [cx + 122, H - 640]], (u) => 9 - u * 3, RA.stone));
    out.push(F(band([[cx + 76, H - 534], [cx + 110, H - 578]], () => 2, RA.sh)));
    out.push(E(cx + 124, H - 648, 9, 9, RA.stone));
    out.push(F(T(rect(cx + 123, H - 642, cx + 125.5, H - 628), RA.deep)));
    out.push(T([[cx + 112, H - 628], [cx + 136, H - 628], [cx + 141, H - 610], [cx + 136, H - 588], [cx + 112, H - 588], [cx + 107, H - 610]], '#b49a74'));
    out.push(F(T([[cx + 115, H - 624], [cx + 133, H - 624], [cx + 137, H - 610], [cx + 133, H - 592], [cx + 115, H - 592], [cx + 111, H - 610]], '#fff0c0')));
    out.push(F(T(rect(cx + 108, H - 632, cx + 140, H - 627), '#b49a74')), F(T(rect(cx + 110, H - 590, cx + 138, H - 585), '#b49a74')));
    // Her neck, her face asleep (closed eyes, a small smile, a blush of rosy stone), waved hair.
    out.push(F(T(rect(cx - 14, H - 592, cx + 14, H - 562), RA.stone)));
    out.push(band([[cx - 26, H - 664], [cx - 46, H - 632], [cx - 50, H - 592], [cx - 62, H - 556]], (u) => 11 - u * 5, RA.stone));
    out.push(band([[cx + 26, H - 664], [cx + 46, H - 632], [cx + 50, H - 592], [cx + 62, H - 556]], (u) => 11 - u * 5, RA.stone));
    out.push(E(cx, H - 626, 42, 44, RA.stone));
    out.push(F(E(cx - 9, H - 634, 28, 30, RA.lit)));
    out.push(F(band(arc(cx, H - 656, 40, 18, 200, 340, 8), () => 3, RA.sh)));
    for (const s of [-1, 1]) {
      out.push(F(band(arc(cx + s * 16, H - 626, 8, 5, 20, 160, 8), () => 1.3, RA.line)));
      out.push(F(band([[cx + s * 22, H - 625], [cx + s * 26, H - 628]], () => 0.9, RA.line)));
      out.push(F(E(cx + s * 25, H - 610, 7, 3.4, RA.blush)));
    }
    out.push(F(band(arc(cx, H - 610, 6, 4, 20, 160, 6), () => 1.1, RA.line)));
    // The crescent-moon crown (its top is the ledge).
    out.push(T([...arc(cx, H - 672, 32, 28, 190, 350, 12), ...arc(cx, H - 670, 22, 14, 350, 190, 12)], RA.gold));
    out.push(F(band(arc(cx, H - 674, 28, 24, 205, 260, 6), () => 1.6, RA.goldLit)));
    out.push(F(E(cx, H - 700, 4, 4, RA.goldLit)));
    // Moss on her shoulders and the plinth.
    moss(out, cx - 66, H - 560, 1.1);
    moss(out, cx + 70, H - 556, 0.9);
    moss(out, cx - 120, H - 80, 1.3);
    moss(out, cx + 116, H - 80, 1.1);
    return out;
  });
}
function drawMaiden(ctx, x, y, time) {
  place(ctx, maidenArt(), x, y);
  // Her lantern glows and flickers.
  const lx = x + 124;
  const ly = y - MM_H + 608;
  const f = 0.82 + 0.1 * Math.sin(time * 5.3) + 0.08 * Math.sin(time * 8.9);
  const g = ctx.createRadialGradient(lx, ly, 3, lx, ly, 70);
  g.addColorStop(0, hexA('#fff2c4', 0.55 * f));
  g.addColorStop(0.35, hexA(RA.glow, 0.2 * f));
  g.addColorStop(1, hexA(RA.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(lx - 70, ly - 70, 140, 140);
}

// ---------- The portico: two great pillars under an arch and its entablature (whose top is a ledge,
// `bare` in the map), the far one chipped; behind, the back wall with a rose window. Its fallen
// floors are ledges. Bottom middle on the crypt floor. ----------
const PO_W = 380;
const PO_H = 690;
function porticoArt() {
  const W = PO_W;
  const H = PO_H;
  const cx = W / 2;
  return art('portico', W, H, () => {
    const out = [];
    const capY = H - 640;
    // The back wall, in shadow, its blocks, and the rose window.
    out.push(T(rect(cx - 124, capY + 10, cx + 124, H), '#857399'));
    for (let y = capY + 40, r = 0; y < H - 10; y += 30, r++) {
      out.push(F(T(rect(cx - 122, y, cx + 122, y + 1.2), '#776590')));
      for (let k = 0; k < 7; k++) out.push(F(T(rect(cx - 116 + k * 38 + (r % 2) * 19, y + 1.2, cx - 115 + k * 38 + (r % 2) * 19, y + 30), '#776590')));
    }
    const wy = H - 560;
    out.push(E(cx, wy, 60, 60, RA.stone));
    out.push(F(E(cx, wy, 52, 52, RA.win)));
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      out.push(F(E(cx + Math.cos(a) * 30, wy + Math.sin(a) * 30, 13, 13, '#7a6aa8')));
    }
    out.push(F(E(cx, wy, 14, 14, '#ffe6b8')), F(E(cx, wy, 8, 8, '#fff6e0')));
    // The pillars: bases, fluted shafts, capitals; the east one chipped.
    for (const s of [-1, 1]) {
      const px = cx + s * 135;
      out.push(T(rect(px - 32, H - 24, px + 32, H + 4), RA.stone), F(T(rect(px - 32, H - 24, px + 32, H - 21), RA.lit)));
      out.push(T(rect(px - 25, capY, px + 25, H - 24), RA.stone));
      out.push(F(T(rect(px - 25, capY, px - 17, H - 24), RA.lit)), F(T(rect(px + 17, capY, px + 25, H - 24), RA.sh)));
      for (const fx of [-10, -3, 4, 11]) out.push(F(T(rect(px + fx, capY + 8, px + fx + 1.4, H - 30), RA.course)));
      out.push(T([[px - 34, capY - 22], [px + 34, capY - 22], [px + 28, capY], [px - 28, capY]], RA.stone), F(T(rect(px - 34, capY - 22, px + 34, capY - 19), RA.lit)));
    }
    out.push(T([[cx + 160, H - 300], [cx + 151, H - 286], [cx + 156, H - 268], [cx + 149, H - 250], [cx + 160, H - 240]], RA.deep));
    // The arch between them, its keystone carved with a crescent.
    out.push(T([...arc(cx, capY - 22, 136, 92, 180, 360, 16), ...arc(cx, capY - 22, 104, 66, 360, 180, 16)], RA.stone));
    out.push(F(band(arc(cx, capY - 22, 132, 88, 190, 260, 8), () => 1.6, RA.lit)));
    for (let k = 1; k < 8; k++) {
      const a = Math.PI + (k * Math.PI) / 8;
      out.push(F(band([[cx + Math.cos(a) * 104, capY - 22 + Math.sin(a) * 66], [cx + Math.cos(a) * 136, capY - 22 + Math.sin(a) * 92]], () => 0.8, RA.course)));
    }
    out.push(T([[cx - 14, capY - 118], [cx + 14, capY - 118], [cx + 10, capY - 86], [cx - 10, capY - 86]], RA.stone));
    out.push(F(E(cx, capY - 103, 6, 6, RA.sh)), F(E(cx + 2.6, capY - 103, 5, 5.6, RA.stone)));
    // The entablature on top (the ledge), dentils under it.
    out.push(T(rect(cx - 186, 0, cx + 186, 26), RA.stone), F(T(rect(cx - 186, 0, cx + 186, 3), RA.lit)), F(T(rect(cx - 186, 20, cx + 186, 26), RA.sh)));
    for (let k = 0; k < 22; k++) out.push(F(T(rect(cx - 180 + k * 17, 26, cx - 172 + k * 17, 32), RA.sh)));
    // Moss along it and vines hanging from the arch.
    for (const mx of [-150, -40, 90, 170]) moss(out, cx + mx, 1, 1);
    for (const [vx, len] of [[-96, 70], [-60, 40], [58, 56], [100, 84]]) {
      const pts = Array.from({ length: 8 }, (_, i) => [cx + vx + Math.sin(i * 0.8) * 3, capY - 40 + Math.abs(vx) * 0.25 + (i * len) / 7]);
      ivy(out, pts, vx);
    }
    return out;
  });
}
function drawPortico(ctx, x, y, time) {
  place(ctx, porticoArt(), x, y);
  // The rose window's glow breathes.
  const wy = y - PO_H + 130;
  const p = 0.5 + 0.5 * Math.sin(time * 0.9);
  const g = ctx.createRadialGradient(x, wy, 6, x, wy, 80);
  g.addColorStop(0, hexA(RA.rose, 0.3 + 0.12 * p));
  g.addColorStop(1, hexA(RA.rose, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 80, wy - 80, 160, 160);
}

// ---------- A stone tomb in the crypt, its lid carved with a curled-up sleeping cat, a candle at
// each end. ----------
const TB_W = 96;
const TB_H = 54;
function tombArt() {
  const W = TB_W;
  const H = TB_H;
  const cx = W / 2;
  return art('tomb', W, H, () => {
    const out = [];
    out.push(T(rect(cx - 42, H - 30, cx + 42, H + 2), RA.stone), F(T(rect(cx - 42, H - 30, cx - 34, H + 2), RA.lit)), F(T(rect(cx + 34, H - 30, cx + 42, H + 2), RA.sh)));
    out.push(F(T(rect(cx - 30, H - 22, cx + 30, H - 6), RA.sh)), F(T(rect(cx - 28, H - 20, cx + 28, H - 8), RA.stone)));
    out.push(T([[cx - 46, H - 30], [cx - 40, H - 38], [cx + 40, H - 38], [cx + 46, H - 30]], RA.stone), F(T(rect(cx - 40, H - 38, cx + 40, H - 36), RA.lit)));
    // The cat on the lid, curled up asleep.
    out.push(E(cx + 2, H - 44, 15, 8, RA.stone), E(cx - 10, H - 46, 7, 6.4, RA.stone));
    out.push(T([[cx - 16, H - 50], [cx - 14, H - 57], [cx - 10, H - 51]], RA.stone), T([[cx - 9, H - 51], [cx - 5, H - 57], [cx - 4, H - 49]], RA.stone));
    out.push(F(band(arc(cx - 12, H - 46, 2, 1.4, 20, 160, 5), () => 0.6, RA.line)), F(band(arc(cx - 6.5, H - 46.5, 2, 1.4, 20, 160, 5), () => 0.6, RA.line)));
    out.push(F(band([[cx + 16, H - 42], [cx + 6, H - 38], [cx - 6, H - 40]], () => 2.2, RA.sh)));
    moss(out, cx + 38, H - 30, 0.7);
    for (const s of [-1, 1]) out.push(T(rect(cx + s * 50 - 3, H - 16, cx + s * 50 + 3, H + 2), '#f4ecdc'));
    return out;
  });
}
function drawTomb(ctx, x, y, time) {
  place(ctx, tombArt(), x, y);
  for (const s of [-1, 1]) {
    const fx = x + s * 50;
    const fy = y - 18;
    const fl = Math.sin(time * 9 + s) * 0.8;
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.ellipse(fx + fl * 0.4, fy - 2, 2.2, 4 + fl * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff4c8';
    ctx.beginPath();
    ctx.ellipse(fx + fl * 0.3, fy - 1, 1, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(fx, fy - 2, 1, fx, fy - 2, 22);
    g.addColorStop(0, hexA('#ffd27a', 0.28));
    g.addColorStop(1, hexA('#ffd27a', 0));
    ctx.fillStyle = g;
    ctx.fillRect(fx - 22, fy - 24, 44, 44);
  }
}

export const RUINS_KINDS = {
  ruintower: { w: TW_W + M * 2, h: TW_H + M, draw: drawTower },
  moonmaiden: { w: MM_W + M * 2, h: MM_H + M, draw: drawMaiden },
  ruinportico: { w: PO_W + M * 2, h: PO_H + M, draw: drawPortico },
  ruintomb: { w: TB_W + M * 2, h: TB_H + M, draw: drawTomb },
};

// ---------- The temple ledges: a carved slab with a lit top and a cornice of little carved moons,
// broken stone hanging under it, moss along its top and over its edge, vines hanging off. A `root`
// end fades into the landmark it grows out of. ----------
const TL_PAD = [10, 8, 50];
const TL_RES = 3;
const TL_FADE = 26;
const tlKept = new Map();
function paintTemple(g, w, root, seed) {
  const rL = root === 'left';
  const rR = root === 'right';
  const n = Math.max(6, Math.round(w / 12));
  const depth = (u) => 18 + Math.sin(Math.PI * u) * Math.min(18, w / 12) + (h01(seed * 3 + Math.floor(u * n)) - 0.5) * 7;
  // The underside: broken stone, its jagged edge, a few block seams.
  const under = [[0, 14]];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    let d = depth(u);
    if (!rL && u < 0.1) d = 14 + (u / 0.1) * (d - 14);
    if (!rR && u > 0.9) d = 14 + ((1 - u) / 0.1) * (d - 14);
    under.push([u * w, d]);
  }
  under.push([w, 14]);
  g.fillStyle = RA.deep;
  g.strokeStyle = RA.line;
  g.lineWidth = 1;
  g.beginPath();
  under.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = shade(RA.deep, 8);
  for (let j = 0; j < Math.round(w / 40); j++) {
    const jx = 12 + h01(seed * 7 + j) * (w - 24);
    g.fillRect(jx, 16, 1, 6 + h01(seed + j) * 8);
  }
  // The slab, chipped at a free end, and its cornice.
  const chipL = rL ? 0 : 3 + h01(seed) * 4;
  const chipR = rR ? 0 : 3 + h01(seed + 1) * 4;
  g.fillStyle = RA.stone;
  g.beginPath();
  g.moveTo(0, 2 + chipL * 0.5);
  g.lineTo(chipL, 0);
  g.lineTo(w - chipR, 0);
  g.lineTo(w, 2 + chipR * 0.5);
  g.lineTo(w, 15);
  g.lineTo(0, 15);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = RA.lit;
  g.fillRect(chipL + 1, 0.8, w - chipL - chipR - 2, 2.2);
  g.fillStyle = RA.sh;
  g.fillRect(0.5, 9, w - 1, 6);
  g.fillStyle = RA.course;
  for (let x = 9 + (seed % 3) * 3; x < w - 6; x += 16) {
    g.beginPath();
    g.arc(x, 12, 1.7, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = RA.line;
  g.fillRect(0.5, 8.6, w - 1, 0.8);
  // Moss on top and spilling over the front.
  for (let j = 0; j < Math.max(2, Math.round(w / 46)); j++) {
    const mx = 8 + h01(seed * 5.1 + j) * (w - 16);
    const mw = 10 + h01(seed * 2.7 + j) * 16;
    g.fillStyle = RA.mossSh;
    g.beginPath();
    g.ellipse(mx, 1, mw * 0.55, 3.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = RA.moss;
    g.beginPath();
    g.ellipse(mx - 1, 0, mw * 0.5, 2.6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = RA.mossLit;
    g.fillRect(mx - mw * 0.3, -1.6, mw * 0.3, 1.2);
    if (h01(seed * 9 + j) > 0.4) {
      g.fillStyle = RA.moss;
      g.beginPath();
      g.ellipse(mx + 2, 6, 3, 4.5, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  // The root end fading into the stone behind.
  if (rL || rR) {
    g.globalCompositeOperation = 'destination-out';
    const x0 = rL ? -2 : w + 2;
    const x1 = rL ? TL_FADE : w - TL_FADE;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.3, 'rgba(0,0,0,0.8)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(Math.min(x0, x1) - 1, -10, Math.abs(x1 - x0) + 2, 80);
    g.globalCompositeOperation = 'source-over';
  }
}
function templePicture(w, root, seed) {
  const key = `${w}|${root}|${seed}`;
  let c = tlKept.get(key);
  if (!c) {
    const [px, pt, pb] = TL_PAD;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + px * 2) * TL_RES);
    c.height = Math.ceil((pt + pb) * TL_RES);
    const g = c.getContext('2d');
    g.scale(TL_RES, TL_RES);
    g.translate(px, pt);
    paintTemple(g, w, root, seed);
    tlKept.set(key, c);
  }
  return c;
}
export function drawTempleLedge(ctx, x, y, w, time, seed, root, wx) {
  x = snap(x);
  y = snap(y);
  if (typeof document === 'undefined') return;
  const [px, pt, pb] = TL_PAD;
  ctx.drawImage(templePicture(w, root, seed), x - px, y - pt, w + px * 2, pt + pb);
  // Vines hanging off its front, swaying in the breeze.
  const wv = windAt(time, x + (wx ?? 0));
  const from = root === 'left' ? TL_FADE : 10;
  const to = root === 'right' ? w - TL_FADE : w - 10;
  for (let j = 0; j < Math.max(1, Math.round(w / 110)); j++) {
    if (h01(seed * 4.3 + j) < 0.35) continue;
    const vx = x + from + h01(seed * 6.1 + j) * (to - from);
    const len = 14 + h01(seed * 8.7 + j) * 22;
    const sway = wv * 3 + Math.sin(time * 1.6 + j + seed) * 1.4;
    ctx.strokeStyle = RA.ivy;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(vx, y + 14);
    ctx.quadraticCurveTo(vx + sway * 0.3, y + 14 + len * 0.6, vx + sway, y + 14 + len);
    ctx.stroke();
    for (let k = 1; k <= 3; k++) {
      const u = k / 3.5;
      ctx.fillStyle = k % 2 ? RA.ivy : RA.ivyLit;
      ctx.beginPath();
      ctx.ellipse(vx + sway * u * u + (k % 2 ? 2.6 : -2.6), y + 14 + len * u, 2.6, 1.6, k % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- The painted dusk behind ----------
function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}
function haze(ctx, width, y, h, c, k) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.4);
  g.addColorStop(0, hexA(c, 0));
  g.addColorStop(0.75, hexA(c, k));
  g.addColorStop(1, hexA(c, k));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h, width, h * 1.4 + 400);
}
// A big pale moon low in the east; the far domes and spires of the rest of the temple; nearer, its
// broken colonnades and arches; mist at their feet, and motes of wisp-light rising slowly.
export function drawPaintedRuins(ctx, t, cam, width, height, time, layerY, air) {
  // 1. The moon.
  {
    const mx = width * 0.74 - cam.x * 0.02;
    const my = layerY(330, 0.02);
    const g = ctx.createRadialGradient(mx, my, 20, mx, my, 170);
    g.addColorStop(0, hexA('#fff4e8', 0.42));
    g.addColorStop(0.4, hexA('#f8d8f0', 0.12));
    g.addColorStop(1, hexA('#f8d8f0', 0));
    ctx.fillStyle = g;
    ctx.fillRect(mx - 170, my - 170, 340, 340);
    ctx.fillStyle = '#fff6ec';
    ctx.beginPath();
    ctx.arc(mx, my, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e2e6';
    for (const [dx, dy, r] of [[-14, -8, 8], [12, 10, 6], [16, -16, 4], [-6, 18, 5]]) {
      ctx.beginPath();
      ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // 2. The far domes and spires.
  const farC = mix(t.far ?? '#9a88c8', air, 0.45);
  const farLit = mix(farC, '#ffe6f0', 0.25);
  const farY = layerY(150, 0.04);
  repeat(cam.x, 0.04, 230, width, (i, x) => {
    const r = h01(i * 1.7);
    const xx = x + h01(i + 3) * 80;
    ctx.fillStyle = farC;
    if (r < 0.45) {
      // A dome on a drum, a little spire on top.
      const dw = 34 + h01(i + 5) * 26;
      const drum = 30 + h01(i + 6) * 40;
      ctx.fillRect(xx - dw, farY - drum, dw * 2, drum + 300);
      ctx.beginPath();
      ctx.ellipse(xx, farY - drum, dw, dw * 0.9, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(xx - 1.5, farY - drum - dw * 0.9 - 14, 3, 16);
      ctx.fillStyle = farLit;
      ctx.beginPath();
      ctx.ellipse(xx - dw * 0.35, farY - drum - dw * 0.45, dw * 0.25, dw * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (r < 0.8) {
      // A slim spire.
      const sh = 90 + h01(i + 7) * 80;
      ctx.beginPath();
      ctx.moveTo(xx - 16, farY + 300);
      ctx.lineTo(xx - 16, farY - sh * 0.55);
      ctx.lineTo(xx, farY - sh);
      ctx.lineTo(xx + 16, farY - sh * 0.55);
      ctx.lineTo(xx + 16, farY + 300);
      ctx.closePath();
      ctx.fill();
    }
  });
  haze(ctx, width, farY, 50, air, 0.45);
  // 3. Nearer: broken colonnades, the odd arch still standing.
  const midC = mix(t.mid ?? '#7a6aa8', air, 0.22);
  const midLit = mix(midC, '#f4e0f8', 0.18);
  const midY = layerY(60, 0.1);
  repeat(cam.x, 0.1, 64, width, (i, x) => {
    const r = h01(i * 2.9);
    if (r < 0.18) return;
    const ch = r > 0.82 ? 150 : 60 + h01(i + 11) * 80;
    ctx.fillStyle = midC;
    ctx.fillRect(x - 9, midY - ch, 18, ch + 300);
    ctx.fillRect(x - 13, midY - ch - 6, 26, 7);
    ctx.fillStyle = midLit;
    ctx.fillRect(x - 9, midY - ch, 4, ch + 300);
    if (r > 0.82) {
      // An arch to the next column.
      ctx.strokeStyle = midC;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(x + 32, midY - ch + 6, 32, Math.PI, 0);
      ctx.stroke();
    }
  });
  haze(ctx, width, midY + 6, 40, air, 0.35);
  // 4. Motes of wisp-light drifting up.
  for (let k = 0; k < 26; k++) {
    const sx = ((h01(k * 3.1) * width * 1.6 - cam.x * 0.15) % (width + 40) + width + 40) % (width + 40) - 20;
    const sy = height + 20 - ((time * (8 + h01(k) * 8) + h01(k * 7.7) * height) % (height + 40));
    const tw = 0.4 + 0.4 * Math.sin(time * 2 + k);
    ctx.fillStyle = hexA('#ffe8b0', tw);
    ctx.fillRect(snap(sx + Math.sin(time * 0.7 + k) * 6), snap(sy), 2, 2);
  }
}
