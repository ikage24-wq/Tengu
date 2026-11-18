// The Hollow Gate (its remake, 2026-11-18, Chapter 3): where Windy Canyon ends at the foot of the
// oldest tree. You come in past the canyon's last sandstone wall; a giant root of the tree arches out
// of the ground (its top is a ledge); Bramble keeps his post in his
// mushroom house; and at the far end the great tree itself rises off the top of the screen, its
// buttress roots framing the glowing doorway down into Rootwood Hollow. High on its bark it sleeps,
// and when the night rumbles come (world/rumble.js) it scrunches its eyes and its rootlets twitch.

import { E, T, F, sprite, blit, snap, mix, shade } from './pixel.js';
import { band } from './propkit.js';
import { windAt } from './terrain.js';
import { rumbleAt } from '../world/rumble.js';

// The tree's bark: plum-brown, lit warm on its west side; its moss and its little glowing mushrooms.
export const GT = {
  bark: '#94606e', lit: '#c08a92', sh: '#744a58', deep: '#563444', groove: '#5e3a4a',
  moss: '#7fc88a', mossLit: '#b4e8a6', mossSh: '#5aa46e',
  glow: '#9fe8d8', pink: '#ffb0d0', amber: '#ffd68a', cap: '#f4ead8', door: '#2e1f36', doorMid: '#3e2a48', doorRim: '#54385e',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`hg|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}


// ---- The great tree's foot, with the door: a vast trunk rising off the top of the picture, four
// buttress roots flaring down into the ground, the doorway between the middle two. Bottom middle at
// the ground. ----
const TREE_W = 440;
const TREE_H = 440;
function treeArt() {
  const W = TREE_W;
  const H = TREE_H;
  const cx = W / 2;
  return art('tree', W, H, () => {
    const out = [];
    // The trunk, a little narrower as it rises, out past the top, flaring at its foot right down
    // into the ground between its roots (no part of it hangs over the air).
    out.push(T([[cx - 158, H + 4], [cx - 146, H - 70], [cx - 130, H - 170], [cx - 116, H - 270], [cx - 110, -M], [cx + 112, -M], [cx + 118, H - 270], [cx + 134, H - 170], [cx + 150, H - 70], [cx + 160, H + 4]], GT.bark));
    // Lit down its west side, shadowed down its east.
    out.push(F(T([[cx - 154, H + 4], [cx - 142, H - 70], [cx - 126, H - 170], [cx - 112, H - 270], [cx - 106, -M], [cx - 70, -M], [cx - 78, H - 270], [cx - 92, H - 170], [cx - 104, H - 70], [cx - 112, H + 4]], GT.lit)));
    out.push(F(T([[cx + 156, H + 4], [cx + 146, H - 70], [cx + 130, H - 170], [cx + 114, H - 270], [cx + 108, -M], [cx + 80, -M], [cx + 90, H - 270], [cx + 104, H - 170], [cx + 116, H - 70], [cx + 122, H + 4]], GT.sh)));
    // Bark grooves running up it, wavering.
    for (let k = 0; k < 9; k++) {
      const gx = cx - 96 + k * 24 + (h01(k) - 0.5) * 8;
      const pts = [];
      for (let q = 0; q <= 10; q++) pts.push([gx + Math.sin(q * 0.9 + k) * 3 + (q / 10) * (gx - cx) * 0.06, H - 40 - q * ((H - 20) / 10)]);
      out.push(F(band(pts, (u) => 2.2 - u * 0.8, GT.groove)));
    }
    // One old knot, high up.
    out.push(F(E(cx + 64, H - 352, 6, 7.8, GT.deep)), F(E(cx + 62.8, H - 354, 3.3, 4.2, GT.sh)));
    // The roots: smooth curves, thick where they leave the trunk, swelling again where they grip
    // the ground, lit along their upper edge, a knobbly foot pressed into the earth; moss lying in
    // soft lumps along the tops of the two big ones.
    const sm = (u) => u * u * (3 - 2 * u);
    const curve = (pts, n = 6) => {
      const res = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        for (let k = 0; k < n; k++) {
          const t = k / n;
          const t2 = t * t;
          const t3 = t2 * t;
          res.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
        }
      }
      res.push(pts[pts.length - 1]);
      return res;
    };
    // (A point moved off the curve, toward its upper side, by `d`.)
    const above = (pts, i, d) => {
      const a = pts[Math.max(0, i - 1)];
      const b = pts[Math.min(pts.length - 1, i + 1)];
      let nx = -(b[1] - a[1]);
      let ny = b[0] - a[0];
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      return [pts[i][0] + nx * d, pts[i][1] + ny * d];
    };
    const root = (ctrl, w0, w1, c, { flare = 1.5, mossy = false, lit = 0.3 } = {}) => {
      const pts = curve(ctrl);
      const n = pts.length - 1;
      // (Growing smoothly out of the bark, with no cut end: it swells from nothing at its start.)
      const wd = (u) => Math.max(3, (w0 + (w1 - w0) * u) * (1 + (flare - 1) * sm(Math.max(0, (u - 0.68) / 0.32))) * sm(Math.min(1, u / 0.26)));
      out.push(band(pts, wd, c));
      const [fx, fy] = pts[n];
      out.push(E(fx + Math.sign(fx - cx) * 2, fy - 2, wd(1) * 0.78, 6, c));
      out.push(F(band(pts.slice(1, -2).map((p, i) => above(pts, i + 1, wd((i + 1) / n) * 0.32)), (u) => wd(u) * 0.22 * lit / 0.3, GT.lit)));
      if (mossy) {
        for (let i = Math.round(n * 0.18); i <= Math.round(n * 0.72); i++) {
          const u = i / n;
          const [mx, my] = above(pts, i, wd(u) * 0.46);
          const r = 3.6 + 2.6 * Math.sin(Math.PI * (u - 0.18) / 0.54) + Math.sin(i * 1.7) * 0.8;
          out.push(F(E(mx, my + 0.6, r * 1.15, r * 0.62, GT.mossSh)), F(E(mx - 0.4, my - 0.2, r, r * 0.5, GT.moss)));
          if (i % 3 === 0) out.push(F(E(mx - r * 0.3, my - r * 0.3, r * 0.4, r * 0.16, GT.mossLit)));
        }
      }
    };
    root([[cx - 96, H - 236], [cx - 112, H - 176], [cx - 132, H - 118], [cx - 156, H - 66], [cx - 190, H - 24], [cx - 222, H - 4], [cx - 240, H + 2]], 46, 22, GT.bark, { lit: 0.36 });
    root([[cx + 98, H - 236], [cx + 116, H - 174], [cx + 136, H - 116], [cx + 160, H - 64], [cx + 194, H - 24], [cx + 224, H - 4], [cx + 242, H + 2]], 46, 22, GT.sh, { lit: 0.18 });
    // The doorway: a tall arch into the dark, deepening inwards, a lip of root round it.
    const doorPts = (s, dy = 0) => {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const a = Math.PI * (k / 16);
        pts.push([cx - Math.cos(a) * 46 * s, H + 2 - dy - Math.sin(a) * 100 * s]);
      }
      return pts;
    };
    // (Its frame: the bark worn smooth round it, lit along its west side, then the dark.)
    out.push(T(doorPts(1.3), GT.sh), F(T(doorPts(1.2), GT.bark)));
    {
      const rim = doorPts(1.24).slice(1, 9);
      out.push(F(band(rim, () => 3, GT.lit)));
    }
    out.push(T(doorPts(1.1), GT.doorRim));
    out.push(F(T(doorPts(1), GT.doorMid)), F(T(doorPts(0.82), '#352442')), F(T(doorPts(0.6), GT.door)));
    // Root steps down into the doorway.
    out.push(E(cx, H - 4, 34, 6, GT.sh), F(E(cx - 6, H - 6, 22, 2.4, GT.lit)));
    return out;
  });
}
// The tree's sleeping face high on its bark (drawn live, so it can scrunch in a rumble and breathe).
function sleepingFace(ctx, x, y, time, k) {
  const breathe = Math.sin(time * 0.5) * 1.2;
  const scrunch = k;
  ctx.save();
  ctx.translate(x, y + breathe);
  ctx.lineCap = 'round';
  // Closed eyes: soft downward curves, squeezed tight in a rumble; little lashes.
  for (const s of [-1, 1]) {
    const ex = s * 34;
    ctx.strokeStyle = GT.deep;
    ctx.lineWidth = 3.4 + scrunch * 1.4;
    ctx.beginPath();
    ctx.moveTo(ex - 13, -2 - scrunch * 3);
    ctx.quadraticCurveTo(ex, 7 - scrunch * 6, ex + 13, -2 - scrunch * 3);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (const lx of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(ex + lx * 0.9, 4 - scrunch * 3 - Math.abs(lx) * 0.3);
      ctx.lineTo(ex + lx * 1.1, 8 - scrunch * 2 - Math.abs(lx) * 0.3);
      ctx.stroke();
    }
    // Mossy brows, lifting a little in the rumble.
    ctx.fillStyle = GT.moss;
    ctx.beginPath();
    ctx.ellipse(ex + s * 2, -14 - scrunch * 4, 16, 4.4, s * -0.12 - scrunch * s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = GT.mossLit;
    ctx.beginPath();
    ctx.ellipse(ex - 3, -16 - scrunch * 4, 8, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // A small round snoring mouth, opening and closing slowly; a wobbly grimace in a rumble.
  const open = 0.5 + 0.5 * Math.sin(time * 0.5 - 1);
  ctx.fillStyle = GT.deep;
  ctx.beginPath();
  ctx.ellipse(0, 27, 6 + scrunch * 4, 3.4 + open * 3.4 * (1 - scrunch), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawTree(ctx, x, y, time, seed, wx, night = 0) {
  place(ctx, treeArt(), x, y);
  const k = rumbleAt(time, night);
  sleepingFace(ctx, x, y - 170, time, k);
  // Its doorway breathes a soft glow, and the lantern hung on the root beside it.
  const p = 0.5 + 0.5 * Math.sin(time * 1.2);
  const g = ctx.createRadialGradient(x, y - 50, 4, x, y - 50, 70);
  g.addColorStop(0, hexA(GT.glow, 0.35 + 0.15 * p));
  g.addColorStop(1, hexA(GT.glow, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 70, y - 120, 140, 120);
  // (The lantern, swinging on its cord from the door's west root.)
  const lx = x - 70;
  const ly = y - 110;
  const sw = Math.sin(time * 1.6) * 0.12 + windAt(time, wx) * 0.05 + k * Math.sin(time * 14) * 0.2;
  // (Its peg: a stub of branch growing out of the bark beside the door.)
  ctx.fillStyle = GT.sh;
  ctx.strokeStyle = GT.deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(lx + 9, ly - 3);
  ctx.quadraticCurveTo(lx + 2, ly - 3, lx - 1.5, ly - 1.4);
  ctx.quadraticCurveTo(lx - 2.6, ly + 0.4, lx - 1, ly + 1.4);
  ctx.quadraticCurveTo(lx + 3, ly + 1.2, lx + 9, ly + 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(lx, ly);
  ctx.rotate(sw);
  ctx.strokeStyle = '#4a3040';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 12);
  ctx.stroke();
  const lg = ctx.createRadialGradient(0, 18, 1, 0, 18, 22);
  lg.addColorStop(0, hexA('#ffd68a', 0.55));
  lg.addColorStop(1, hexA('#ffd68a', 0));
  ctx.fillStyle = lg;
  ctx.fillRect(-22, -4, 44, 44);
  ctx.fillStyle = '#6a4a3a';
  ctx.fillRect(-4.5, 11, 9, 2.4);
  ctx.fillStyle = '#ffe6a0';
  ctx.beginPath();
  ctx.roundRect(-4, 13, 8, 10, 2.5);
  ctx.fill();
  ctx.strokeStyle = '#6a4a3a';
  ctx.stroke();
  ctx.fillStyle = '#6a4a3a';
  ctx.fillRect(-4.5, 22.5, 9, 2.4);
  ctx.restore();
}

// ---- The root arch: one of the tree's roots arching out of the ground and back in, thick and
// mossy, its top flat enough to stand on (the map's ledge there is drawn by it). `rise` from the
// ground to its top. ----
const ARCH_W = 320;
function rootArchPath(rise) {
  const a = 132;
  const b = rise - 11;
  const cx = ARCH_W / 2;
  const pts = [];
  for (let k = 0; k <= 24; k++) {
    const t = Math.PI * (k / 24);
    pts.push([cx - Math.cos(t) * a, rise + 3 - Math.sin(t) ** 0.42 * b]);
  }
  return pts;
}
function archArt(rise) {
  const W = ARCH_W;
  const H = rise + 3;
  return art(`arch|${rise}`, W, H + 10, () => {
    const out = [];
    const path = rootArchPath(rise);
    // Its feet diving into the ground, flaring.
    const wd = (u) => 22 + 10 * Math.max(0, 1 - Math.sin(Math.PI * u) * 3);
    out.push(band(path, wd, GT.bark));
    // Shade underneath, lit along its top, bark grooves running along it.
    out.push(F(band(path.map(([x, y]) => [x, y + 6]), (u) => wd(u) * 0.35, GT.sh)));
    out.push(F(band(path.map(([x, y]) => [x, y - 6.5]), (u) => wd(u) * 0.22, GT.lit)));
    for (const off of [-1.5, 3]) out.push(F(band(path.slice(2, -2).map(([x, y]) => [x, y + off]), () => 0.9, GT.groove)));
    // A blanket of moss along the top (where you stand): one soft lumpy layer, thinning out to
    // nothing toward its ends, a few lit tufts on it.
    {
      const top = path.slice(4, 21).map(([x, y]) => [x, y - 9.6]);
      const taper = (u) => Math.min(1, Math.sin(Math.PI * u) * 3);
      out.push(F(band(top, (u) => (4.6 + 1.6 * Math.sin(u * 37)) * taper(u), GT.mossSh)));
      out.push(F(band(top.map(([x, y]) => [x, y - 1]), (u) => (3.4 + 1.3 * Math.sin(u * 37 + 0.8)) * taper(u), GT.moss)));
      for (const k of [3, 6, 10, 13]) out.push(F(E(top[k][0] - 1, top[k][1] - 2.4, 4, 0.9, GT.mossLit)));
    }
    // Little sprouts and a mushroom or two on it.
    for (const [sx, sy] of [[path[9][0], path[9][1] - 13], [path[15][0], path[15][1] - 13]]) {
      out.push(F(T([[sx, sy + 2], [sx - 1, sy - 4], [sx + 1, sy - 4]], GT.mossSh)), F(E(sx - 3, sy - 5, 3, 1.6, GT.moss)), F(E(sx + 3, sy - 6, 3, 1.6, GT.mossLit)));
    }
    return out;
  });
}
// (`seed` 100 or more: a taller arch, that many px from the ground to its top; else 80.)
function drawArch(ctx, x, y, time, seed, wx, night = 0) {
  const rise = seed >= 100 ? seed : 80;
  place(ctx, archArt(rise), x, y + 10);
  // Rootlets hanging from under it, swaying; in a rumble they twitch, and soil sifts down.
  const k = rumbleAt(time, night);
  const path = rootArchPath(rise);
  const ox = x - ARCH_W / 2;
  const oy = y - rise - 3;
  ctx.save();
  ctx.lineCap = 'round';
  for (const i of [7, 10, 14, 17]) {
    const [px, py] = path[i];
    const sx = ox + px;
    const sy = oy + py + 10;
    const len = 9 + h01(i) * 8;
    const sway = Math.sin(time * 1.3 + i) * 2 + windAt(time, wx + px) * 1.2 + k * Math.sin(time * 19 + i) * 3;
    ctx.strokeStyle = GT.sh;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + sway * 0.4, sy + len * 0.6, sx + sway, sy + len);
    ctx.stroke();
    if (k > 0.02) {
      ctx.fillStyle = hexA('#d8b8a0', 0.8 * k);
      for (let g = 0; g < 5; g++) ctx.fillRect(snap(sx + Math.sin(g * 2 + i) * 2), snap(sy + ((time * 60 + g * 11 + i * 7) % 60)), 1.2, 1.6);
    }
  }
  ctx.restore();
}

// A short stretch of the canyon's last wall, where you come in (render/canyon.js draws it).
export const HOLLOWGATE_KINDS = {
  greattree: { w: TREE_W + M * 2, h: TREE_H + M, draw: drawTree },
  rootarch: { w: ARCH_W + M * 2, h: 140, draw: drawArch },
};

// ---------- The painted backdrop ----------

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
// The far canyon behind (to the west, fading out under the tree), the trunks of other old trees in
// the dusk haze, and the great tree's canopy spreading over the east like a ceiling of leaves, moss
// hanging from it; soft beams of low sun slanting in from the canyon.
export function drawPaintedHollowGate(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#ffd6b0';
  // 1. The low sun's glow over the canyon, in the west.
  {
    const gx = width * 0.1 - cam.x * 0.05;
    const gy = layerY(120, 0.03) - 90;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(width, height) * 0.8);
    g.addColorStop(0, hexA('#ffd2a0', 0.55));
    g.addColorStop(0.4, hexA('#ffb08a', 0.14));
    g.addColorStop(1, hexA('#ffb08a', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // 2. The canyon's far mesas, warm, thinning out to the east.
  const mesaC = mix('#e0a080', air, 0.5);
  const farY = layerY(90, 0.05);
  repeat(cam.x, 0.05, 200, width, (i, x) => {
    const wx = x + cam.x * 0.05;
    const fade = Math.max(0, Math.min(1, (620 - wx) / 380));
    if (fade <= 0 || h01(i + 3) < 0.2) return;
    const w = 90 + h01(i + 4) * 80;
    const h = 40 + h01(i + 5) * 50;
    ctx.globalAlpha = fade;
    ctx.fillStyle = mesaC;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.6, farY + 200);
    ctx.lineTo(x - w * 0.6, farY);
    ctx.lineTo(x - w * 0.45, farY - h * 0.3);
    ctx.lineTo(x - w * 0.42, farY - h);
    ctx.lineTo(x + w * 0.42, farY - h);
    ctx.lineTo(x + w * 0.45, farY - h * 0.3);
    ctx.lineTo(x + w * 0.6, farY);
    ctx.lineTo(x + w * 0.6, farY + 200);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  haze(ctx, width, farY, 40, air, 0.5);
  // 3. Other old trees' trunks far off in the dusk, growing thicker to the east.
  const trunkC = mix(t.far ?? '#9a6a9a', air, 0.35);
  const trunkLit = mix(trunkC, sun, 0.2);
  const midY = layerY(40, 0.12);
  repeat(cam.x, 0.12, 150, width, (i, x) => {
    const wx = x + cam.x * 0.12;
    const thick = Math.max(0, Math.min(1, (wx - 180) / 420));
    if (thick <= 0.05 || h01(i * 2.3) < 0.25) return;
    const tw = (14 + h01(i + 9) * 18) * (0.5 + thick);
    const xx = x + h01(i + 8) * 60;
    ctx.fillStyle = trunkC;
    ctx.beginPath();
    ctx.moveTo(xx - tw * 1.6, midY + 200);
    ctx.quadraticCurveTo(xx - tw * 0.8, midY - 6, xx - tw * 0.55, midY - 60);
    ctx.lineTo(xx - tw * 0.5, -10);
    ctx.lineTo(xx + tw * 0.5, -10);
    ctx.lineTo(xx + tw * 0.55, midY - 60);
    ctx.quadraticCurveTo(xx + tw * 0.8, midY - 6, xx + tw * 1.6, midY + 200);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = trunkLit;
    ctx.fillRect(xx - tw * 0.5, -10, tw * 0.22, midY + 50);
  });
  // (Their leafy crowns, round purple clumps like the old forest's, and a row of bushes on the
  // horizon at their feet.)
  const crown = mix('#8a6aa8', air, 0.3);
  const crownLit = mix('#a888c0', air, 0.3);
  repeat(cam.x, 0.12, 150, width, (i, x) => {
    if (h01(i * 2.3) < 0.25) return;
    const xx = x + h01(i + 8) * 60;
    const top = 30 + h01(i + 40) * 50;
    for (let k = 0; k < 4; k++) {
      const cxk = xx + (k - 1.5) * 22 + Math.sin(time * 0.5 + i + k) * 1.2;
      const cyk = top + (k % 2) * 12 - (k === 1 || k === 2 ? 10 : 0);
      const r = 22 + h01(i * 3 + k) * 10;
      ctx.fillStyle = crown;
      ctx.beginPath();
      ctx.ellipse(cxk, cyk, r, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = crownLit;
      ctx.beginPath();
      ctx.ellipse(cxk - r * 0.3, cyk - r * 0.3, r * 0.45, r * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // (A row of round purple trees standing on the horizon, the old forest the Hollow sits in.)
  const rowY = layerY(28, 0.18);
  const rowC = mix('#8a6aa8', air, 0.42);
  const rowLit = mix('#b090c8', air, 0.42);
  const rowTrunk = mix('#7a5a7a', air, 0.45);
  repeat(cam.x, 0.18, 74, width, (i, x) => {
    if (h01(i * 5.3 + 2) < 0.18) return;
    const xx = x + h01(i + 90) * 30;
    const hgt = 62 + h01(i + 91) * 52;
    const r = 18 + h01(i + 92) * 10;
    ctx.fillStyle = rowTrunk;
    ctx.fillRect(xx - 2.5, rowY - hgt + r, 5, hgt - r + 10);
    const sway = Math.sin(time * 0.6 + i * 1.3) * 1.2;
    ctx.fillStyle = rowC;
    for (const [dx, dy, k] of [[0, 0, 1], [-r * 0.7, r * 0.5, 0.7], [r * 0.7, r * 0.45, 0.72]]) {
      ctx.beginPath();
      ctx.ellipse(xx + dx + sway, rowY - hgt + r * 0.6 + dy, r * k, r * k * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = rowLit;
    ctx.beginPath();
    ctx.ellipse(xx - r * 0.3 + sway, rowY - hgt + r * 0.3, r * 0.45, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = mix('#7a5a98', air, 0.35);
  repeat(cam.x, 0.16, 40, width, (i, x) => {
    const r = 16 + h01(i + 70) * 12;
    ctx.beginPath();
    ctx.ellipse(x + 20, midY + 4, r, r * 0.7, 0, Math.PI, 0);
    ctx.fill();
  });
  haze(ctx, width, midY, 50, air, 0.4);
  // 4. The great tree's canopy, a ceiling of leaves over the east, scalloped along its edge, moss
  // hanging down from it, swaying.
  const leaf = mix('#4f3a6a', air, 0.25);
  const leafLit = mix('#6f5a8a', air, 0.25);
  const edgeAt = (sx) => {
    const wx = sx + cam.x * 0.6;
    const reach = Math.max(0, Math.min(1, (wx - 260) / 420));
    return reach <= 0 ? -60 : -20 + reach * 90 + Math.sin(wx * 0.05) * 6 + Math.sin(wx * 0.13) * 3;
  };
  ctx.fillStyle = leaf;
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  for (let sx = -4; sx <= width + 8; sx += 6) ctx.lineTo(sx, edgeAt(sx) + 6 * Math.abs(Math.sin((sx + cam.x * 0.6) * 0.09)));
  ctx.lineTo(width + 8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = leafLit;
  repeat(cam.x, 0.6, 26, width, (i, x) => {
    const y = edgeAt(x) - 8;
    if (y < -20) return;
    ctx.beginPath();
    ctx.ellipse(x + 8, y, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.strokeStyle = mix('#7fae8a', air, 0.3);
  ctx.lineWidth = 1.4;
  repeat(cam.x, 0.6, 46, width, (i, x) => {
    const y0 = edgeAt(x + 10);
    if (y0 < 0 || h01(i * 4.1) < 0.35) return;
    const len = 16 + h01(i + 30) * 30;
    const sw = Math.sin(time * 0.9 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y0);
    ctx.quadraticCurveTo(x + 10 + sw * 0.5, y0 + len * 0.6, x + 10 + sw, y0 + len);
    ctx.stroke();
  });
  // 5. Low sunbeams slanting in from the canyon.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  repeat(cam.x, 0.2, 260, width, (i, x) => {
    const wx = x + cam.x * 0.2;
    if (wx > 360 || h01(i + 61) < 0.3) return;
    const w = 30 + h01(i + 62) * 26;
    const a = (0.04 + 0.015 * Math.sin(time * 0.3 + i * 1.9)) * (0.7 + 0.5 * h01(i + 63));
    const g = ctx.createLinearGradient(x, 0, x + 200, height);
    g.addColorStop(0, hexA('#ffd2a0', a * 1.3));
    g.addColorStop(1, hexA('#ffd2a0', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + w, -10);
    ctx.lineTo(x + w * 1.4 + 220, height);
    ctx.lineTo(x + 220, height);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}
