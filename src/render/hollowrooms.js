// Rootwood Hollow's rooms (their remake, 2026-11-18, Chapter 3): you're inside the oldest tree.
// What the rooms are built from: the inner walls of the great trunk, wood grain lit by moonlight
// from the opening far above; stumps and roots standing on the floor; branches grown out of the walls
// for every ledge (render/terrain.js drawBranch); hanging vines to climb instead of rope; and behind
// it all the far side of the hollow, its grain and knotholes in the dark.

import { E, T, F, sprite, blit, snap, mix, shade } from './pixel.js';
import { band } from './propkit.js';
import { windAt } from './terrain.js';

// The tree's inner wood, matching the branches (terrain.js BARK) so a branch grows out of it.
export const TW = {
  bark: '#9a7356', lit: '#c09a76', sh: '#7a5840', deep: '#5a4030', groove: '#6a4a36',
  moss: '#7fc07a', mossLit: '#b2e09c', mossSh: '#5a9a62', vine: '#5f9a5a', leaf: '#7fc47a',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`hr|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}

// ---- The trunk's inner wall: a tall band of living wood up one side of the room, its inner face
// bulging gently, grain running up it, a few knots, a little moss, roots flaring into the floor at
// its foot. `side` 0 is the west wall (its face on the right), 1 the east (mirrored). Bottom middle
// at the floor. ----
const WALL_W = 170;
const WALL_FACE = 132;
function wallArt(side, rise) {
  const W = WALL_W;
  const h = rise + 3;
  return art(`wall|${side}|${rise}`, W, h, () => {
    const out = [];
    const mir = (sh) => {
      if (!side) return sh;
      if (sh.pts) return { ...sh, pts: sh.pts.map(([px, py]) => [W - px, py]) };
      return { ...sh, x: W - sh.x };
    };
    const push = (...s) => out.push(...s.map(mir));
    const faceAt = (y) => WALL_FACE + 9 * Math.sin(y * 0.011 + side * 2) + 5 * Math.sin(y * 0.029 + 1);
    const body = [[-M, -M]];
    for (let y = -M; y <= h; y += 12) body.push([faceAt(y), y]);
    body.push([faceAt(h), h], [-M, h]);
    push(T(body, TW.bark));
    // Its face catching the light, a shadow just inside it.
    const strip = (d0, d1, c) => {
      const pts = [];
      for (let y = -M; y <= h; y += 12) pts.push([faceAt(y) - d0, y]);
      for (let y = h; y >= -M; y -= 12) pts.push([faceAt(y) - d1, y]);
      push(F(T(pts, c)));
    };
    strip(0, 7, TW.lit);
    strip(9, 15, TW.sh);
    // Grain running up it, wavering round the knots.
    for (let k = 0; k < 6; k++) {
      const gx = 12 + k * 19 + h01(k + side * 7) * 6;
      const pts = [];
      for (let y = -M; y <= h; y += 16) pts.push([gx + Math.sin(y * 0.02 + k * 1.7) * 4, y]);
      push(F(band(pts, () => 1.6, TW.groove)));
    }
    // A few knots, well apart (never two side by side, so none reads as a pair of eyes).
    for (const [ky, kx] of [[h * 0.22, 0.6], [h * 0.55, 0.35], [h * 0.82, 0.7]]) {
      const x = 20 + kx * (WALL_FACE - 50);
      push(F(E(x, ky, 7, 10, TW.deep)), F(E(x - 1.4, ky - 1.6, 4, 6, TW.sh)));
    }
    // Moss in a couple of soft patches on the face.
    for (const fy of [h * 0.4, h * 0.7]) {
      const x = faceAt(fy) - 6;
      push(F(E(x, fy, 7, 16, TW.mossSh)), F(E(x - 1, fy - 2, 5.4, 13, TW.moss)), F(E(x - 2.4, fy - 6, 2.2, 5, TW.mossLit)));
    }
    // Roots flaring from its foot into the floor.
    for (const [x0, len, wd] of [[WALL_FACE - 30, 60, 16], [WALL_FACE - 6, 40, 11]]) {
      const pts = [];
      for (let q = 0; q <= 8; q++) {
        const u = q / 8;
        pts.push([x0 + u * len, h - 54 + 54 * Math.sin((u * Math.PI) / 2) + u * 2]);
      }
      push(band(pts, (u) => wd * (1 - u * 0.5), TW.bark), F(band(pts.map(([x, y]) => [x, y - wd * 0.28]), (u) => wd * 0.25 * (1 - u), TW.lit)));
    }
    return out;
  });
}
function drawWall(ctx, x, y, time, seed) {
  place(ctx, wallArt(seed % 2, 940), x, y);
}

// ---- A stump: an old broken-off root standing on the floor, flat on top (a ledge sits on it),
// rings on its top, bark grooves down it, roots splaying at its foot. `rise` to its top. ----
function stumpArt(rise) {
  const W = 120;
  const h = rise + 3;
  const cx = W / 2;
  return art(`stump|${rise}`, W, h, () => {
    const out = [];
    const top = h - rise;
    out.push(T([[cx - 46, h], [cx - 34, h - 16], [cx - 30, top + 12], [cx - 26, top + 2], [cx + 26, top + 2], [cx + 30, top + 12], [cx + 34, h - 16], [cx + 48, h]], TW.bark));
    out.push(F(T([[cx - 42, h], [cx - 31, h - 16], [cx - 27, top + 12], [cx - 18, top + 6], [cx - 16, h - 20], [cx - 24, h]], TW.lit)));
    out.push(F(T([[cx + 44, h], [cx + 32, h - 16], [cx + 28, top + 12], [cx + 18, top + 8], [cx + 18, h - 18], [cx + 28, h]], TW.sh)));
    for (const gx of [-10, 2, 12]) {
      const pts = [];
      for (let q = 0; q <= 6; q++) pts.push([cx + gx + Math.sin(q * 1.1 + gx) * 1.6, top + 14 + ((h - top - 20) * q) / 6]);
      out.push(F(band(pts, () => 1.4, TW.groove)));
    }
    // Its broken top: a lip of bark round the pale rings of the wood.
    out.push(E(cx, top + 4, 29, 6, TW.sh), E(cx, top + 3, 26, 4.6, '#e2c49a'), F(E(cx, top + 3, 17, 3, '#cba67e')), F(E(cx, top + 3, 8, 1.4, '#e2c49a')));
    out.push(F(E(cx - 12, top + 1.6, 7, 1.4, TW.mossLit)), F(E(cx - 14, top + 2.2, 6, 1.6, TW.moss)));
    return out;
  });
}
function drawStump(ctx, x, y, time, seed) {
  place(ctx, stumpArt(140), x, y);
}

export const HOLLOWROOM_KINDS = {
  trunkwall: { w: WALL_W + M * 2, h: 980, draw: drawWall },
  hollowstump: { w: 200, h: 200, draw: drawStump },
};

// ---------- Hanging vines to climb (a room's `look.ropes: 'vine'`) ----------

// A vine hanging from the dark above to its foot: a twisting green stem, leaves in pairs down it,
// swaying a little in the air moving up the trunk.
export function drawVine(ctx, r, cam, time) {
  const x = r.x - cam.x;
  const top = r.top - cam.y - 10;
  const bottom = r.bottom - cam.y;
  const len = bottom - top;
  if (len <= 0) return;
  const sway = (u) => Math.sin(time * 0.9 + r.x * 0.03 + u * 3) * 1.6 * u;
  ctx.save();
  ctx.lineCap = 'round';
  for (const [c, w, off] of [['#3e6a3e', 5, 0], [TW.vine, 3.6, 0], ['#8fc884', 1.2, -0.9]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let q = 0; q <= 16; q++) {
      const u = q / 16;
      const px = x + Math.sin(u * len * 0.09 + r.x) * 1.4 + sway(u) + off;
      const py = top + u * len;
      if (q) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  // Leaves in pairs down it.
  for (let y = 14, k = 0; y < len - 6; y += 22, k++) {
    const u = y / len;
    const px = x + Math.sin(u * len * 0.09 + r.x) * 1.4 + sway(u);
    for (const s of [-1, 1]) {
      ctx.fillStyle = s < 0 ? TW.leaf : TW.mossSh;
      ctx.beginPath();
      ctx.ellipse(px + s * 5, top + y + (k % 2) * 2, 4.6, 2.2, s * (0.5 + 0.1 * Math.sin(time + k)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- The painted backdrop: the far side of the hollow ----------

function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}
// The far inner wall of the trunk, all wood grain, a few knotholes; at the top the opening the
// group climbed in by, night sky and the moon's light pouring down through it in soft beams.
export function drawPaintedHollowTrunk(ctx, t, cam, width, height, time, layerY, air, map) {
  const wood = mix('#5e4038', air, 0.12);
  const woodLit = mix(wood, '#c8a888', 0.16);
  const groove = mix(wood, '#1e1420', 0.35);
  ctx.fillStyle = wood;
  ctx.fillRect(0, 0, width, height);
  // Broad columns of grain, slightly different shades, their edges wavering.
  repeat(cam.x, 0.35, 46, width, (i, x) => {
    const k = h01(i * 3.1);
    ctx.fillStyle = k > 0.6 ? woodLit : k < 0.25 ? groove : wood;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(x, height + 10);
    for (let y = height; y >= -10; y -= 20) ctx.lineTo(x + Math.sin(y * 0.02 + i) * 5, y);
    for (let y = -10; y <= height; y += 20) ctx.lineTo(x + 30 + h01(i) * 10 + Math.sin(y * 0.018 + i * 2) * 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = groove;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let y = -10; y <= height + 10; y += 20) {
      const px = x + Math.sin(y * 0.02 + i) * 5;
      if (y === -10) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  });
  // A few knotholes, a faint light in the odd one.
  repeat(cam.x, 0.35, 310, width, (i, x) => {
    const wy = 160 + h01(i * 7.3) * 600;
    const y = wy - cam.y * 0.35;
    if (y < -30 || y > height + 30 || h01(i + 4) < 0.35) return;
    ctx.fillStyle = groove;
    ctx.beginPath();
    ctx.ellipse(x + 40, y, 9, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = mix(groove, '#000000', 0.3);
    ctx.beginPath();
    ctx.ellipse(x + 41, y + 1, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  // Other limbs crossing the hollow far behind, dim in the dark, a little moss along their tops.
  const far = mix(wood, '#1e1420', 0.28);
  repeat(cam.x, 0.5, 520, width, (i, x) => {
    if (h01(i * 5.7) < 0.3) return;
    const wy = 200 + h01(i * 2.9) * 560;
    const y = wy - cam.y * 0.5;
    if (y < -40 || y > height + 40) return;
    const len = 220 + h01(i + 3) * 160;
    const dir = h01(i + 6) > 0.5 ? 1 : -1;
    const x0 = x + (dir > 0 ? 0 : 260);
    const tx = x0 + dir * len;
    // Its root end melts back into the far wall's dark (no cut-off end); it tapers, sagging a
    // little, to a point with a twig.
    ctx.save();
    const fade = (c) => {
      const gr = ctx.createLinearGradient(x0, 0, x0 + dir * 90, 0);
      gr.addColorStop(0, c + '00');
      gr.addColorStop(1, c);
      return gr;
    };
    ctx.fillStyle = fade(far);
    ctx.beginPath();
    ctx.moveTo(x0, y - 9);
    ctx.quadraticCurveTo(x0 + dir * len * 0.55, y - 9, tx, y + 2);
    ctx.quadraticCurveTo(x0 + dir * len * 0.55, y + 8, x0, y + 13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = far;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0 + dir * len * 0.72, y - 1);
    ctx.quadraticCurveTo(x0 + dir * len * 0.8, y - 12, x0 + dir * len * 0.86, y - 16);
    ctx.stroke();
    ctx.strokeStyle = fade(mix(far, '#7fc07a', 0.3));
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y - 9);
    ctx.quadraticCurveTo(x0 + dir * len * 0.4, y - 9.5, x0 + dir * len * 0.7, y - 5.5);
    ctx.stroke();
    ctx.restore();
  });
  // The opening far above, where the group climbed in: night sky, a few stars, moonlight.
  const ox = (map?.width ?? width) * 0.5 - cam.x * 0.5;
  const oy = -40 - cam.y * 0.5;
  if (oy > -260) {
    const g = ctx.createRadialGradient(ox, oy + 40, 10, ox, oy + 40, 260);
    g.addColorStop(0, hexA('#cfe6ff', 0.4));
    g.addColorStop(1, hexA('#cfe6ff', 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#1e2a4a';
    ctx.beginPath();
    ctx.ellipse(ox, oy, 120, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (let s = 0; s < 9; s++) {
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + s * 1.7);
      ctx.globalAlpha = 0.4 + 0.5 * tw;
      ctx.fillRect(ox - 90 + h01(s) * 180, oy - 50 + h01(s + 9) * 80, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;
    // Its rim: the wood's edge, leaves hanging over it.
    ctx.strokeStyle = mix(TW.bark, '#1e1420', 0.5);
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(ox, oy, 122, 72, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = mix('#3e6a4e', '#1e1420', 0.3);
    for (let k = 0; k < 14; k++) {
      const a = Math.PI * (0.05 + 0.9 * (k / 13));
      ctx.beginPath();
      ctx.ellipse(ox - Math.cos(a) * 118, oy + Math.sin(a) * 68 + 4, 9, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Moonbeams slanting down from it, swaying slowly.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 4; k++) {
    const a = (0.035 + 0.015 * Math.sin(time * 0.4 + k * 2)) * (k === 1 ? 1.4 : 1);
    const x0 = ox - 70 + k * 45;
    const g = ctx.createLinearGradient(0, oy + 40, 0, height);
    g.addColorStop(0, hexA('#cfe6ff', a * 2));
    g.addColorStop(1, hexA('#cfe6ff', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, oy + 40);
    ctx.lineTo(x0 + 26, oy + 40);
    ctx.lineTo(x0 + 26 + 120 + k * 20, height + 40);
    ctx.lineTo(x0 + 60 + k * 20, height + 40);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // A haze of dark at the bottom, toward the trunk's floor.
  const g = ctx.createLinearGradient(0, height * 0.55, 0, height);
  g.addColorStop(0, hexA('#140e18', 0));
  g.addColorStop(1, hexA('#140e18', 0.4));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

// ---------- The ledges: limbs grown out of the trunk's walls (`style: 'limb'`) ----------

// A thick limb of the tree reaching out across the hollow: flat along its top where you walk, its
// bark swelling and thinning underneath, thickest where it leaves the wall and tapering to a leafy
// tip, grooves running along it, a soft blanket of moss on top, a couple of vines hanging from it.
// Its root end fades into the wall (drawn behind), so the two read as one wood. `root`: 'left' or
// 'right' (the wall it grows from), or none (free both ends: a fallen limb lodged across).
const LIMB_FADE = 30;
const LIMB_RES = 3;
const LIMB_PAD = [24, 16, 52];
const limbKept = new Map();
const limbDepth = (w, root, seed) => (u) => {
  const fromRoot = root === 'left' ? u : root === 'right' ? 1 - u : 0.5 - Math.abs(u - 0.5);
  const base = root ? 30 - 14 * Math.pow(fromRoot, 0.8) : 18 + 6 * Math.sin(Math.PI * u);
  return base + 2.2 * Math.sin(u * w * 0.045 + seed) + 1.4 * Math.sin(u * w * 0.12 + seed * 2);
};
function paintLimb(g, w, root, seed) {
  const n = Math.max(8, Math.round(w / 10));
  const depth = limbDepth(w, root, seed);
  const rL = root === 'left';
  const rR = root === 'right';
  const pts = [];
  // Across the top, round the free ends, back along the underside.
  pts.push(rL ? [0, -1] : [4, -1]);
  pts.push(rR ? [w, -1] : [w - 4, -1]);
  if (!rR) pts.push([w + 2, depth(1) * 0.4]);
  for (let i = n; i >= 0; i--) pts.push([(i / n) * w, depth(i / n)]);
  if (!rL) pts.push([-2, depth(0) * 0.4]);
  const trace = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  };
  g.save();
  trace();
  g.fillStyle = TW.bark;
  g.fill();
  g.clip();
  // Shadow along its underside, lit along its top.
  g.strokeStyle = TW.sh;
  g.lineWidth = 12;
  g.beginPath();
  for (let i = 0; i <= n; i++) g.lineTo((i / n) * w, depth(i / n) + 2);
  g.stroke();
  g.strokeStyle = TW.deep;
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= n; i++) g.lineTo((i / n) * w, depth(i / n) + 0.5);
  g.stroke();
  g.fillStyle = TW.lit;
  g.fillRect(-4, 2, w + 8, 3);
  // Grooves running along it, following its swell.
  g.strokeStyle = TW.groove;
  g.lineWidth = 1.2;
  for (const k of [0.38, 0.62]) {
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const y = 4 + (depth(u) - 6) * k + Math.sin(u * w * 0.07 + k * 9 + seed) * 1.4;
      if (i) g.lineTo(u * w, y);
      else g.moveTo(u * w, y);
    }
    g.stroke();
  }
  // A knot or two.
  for (let j = 0; j < Math.max(1, Math.round(w / 300)); j++) {
    const u = 0.25 + 0.5 * h01(seed * 3 + j);
    const kx = u * w;
    const ky = depth(u) * 0.55;
    g.fillStyle = TW.deep;
    g.beginPath();
    g.ellipse(kx, ky, 4.4, 3.2, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = TW.sh;
    g.beginPath();
    g.ellipse(kx - 0.8, ky - 0.6, 2.4, 1.6, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
  trace();
  g.strokeStyle = shade(TW.bark, -30);
  g.lineWidth = 1;
  g.stroke();
  // The moss blanket on top: one soft lumpy layer, thinning out toward the ends.
  const m0 = rL ? 0.12 : 0.06;
  const m1 = rR ? 0.88 : 0.9;
  for (const [c, wd, dy] of [[TW.mossSh, 4.2, 0], [TW.moss, 3.2, -1]]) {
    g.fillStyle = c;
    g.beginPath();
    const top = [];
    const bot = [];
    for (let i = 0; i <= 40; i++) {
      const u = m0 + ((m1 - m0) * i) / 40;
      const taper = Math.min(1, Math.sin((Math.PI * i) / 40) * 3);
      const h = (wd + 1.4 * Math.sin(u * w * 0.08 + seed)) * taper;
      top.push([u * w, dy - h * 0.55]);
      bot.push([u * w, dy + h * 0.45]);
    }
    g.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) g.lineTo(x, y);
    for (const [x, y] of bot.reverse()) g.lineTo(x, y);
    g.closePath();
    g.fill();
  }
  g.fillStyle = TW.mossLit;
  for (let j = 0; j < Math.round(w / 90); j++) {
    const x = (m0 + (m1 - m0) * (0.1 + 0.8 * h01(seed * 7 + j))) * w;
    g.beginPath();
    g.ellipse(x, -2.4, 4, 0.9, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Its free tip: a twig curling up with a few leaves.
  for (const d of [rR ? 0 : 1, rL ? 0 : -1]) {
    if (!d) continue;
    const tx = d > 0 ? w - 2 : 2;
    g.strokeStyle = shade(TW.bark, -12);
    g.lineWidth = 2.4;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(tx - 6 * d, 4);
    g.quadraticCurveTo(tx + 6 * d, 2, tx + 12 * d, -9);
    g.stroke();
    for (const [lx, ly, a] of [[12, -11, -1.1], [7, -4, -0.5], [15, -4, 0.3]]) {
      g.fillStyle = TW.leaf;
      g.strokeStyle = TW.mossSh;
      g.lineWidth = 0.8;
      g.beginPath();
      g.ellipse(tx + lx * d, ly, 4.6, 2.2, a * d, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }
  // Its root end fading into the wall behind.
  if (rL || rR) {
    g.globalCompositeOperation = 'destination-out';
    const x0 = rL ? -2 : w + 2;
    const x1 = rL ? LIMB_FADE : w - LIMB_FADE;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.3, 'rgba(0,0,0,0.8)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(Math.min(x0, x1) - 1, -16, Math.abs(x1 - x0) + 2, 80);
    g.globalCompositeOperation = 'source-over';
  }
}
function limbPicture(w, root, seed) {
  const key = `${w}|${root}|${seed}`;
  let c = limbKept.get(key);
  if (!c) {
    const [px, pt, pb] = LIMB_PAD;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + px * 2) * LIMB_RES);
    c.height = Math.ceil((pt + pb) * LIMB_RES);
    const g = c.getContext('2d');
    g.scale(LIMB_RES, LIMB_RES);
    g.translate(px, pt);
    paintLimb(g, w, root, seed);
    limbKept.set(key, c);
  }
  return c;
}
export function drawLimb(ctx, x, y, w, time, seed, root, wx) {
  x = snap(x);
  y = snap(y);
  if (typeof document === 'undefined') return;
  const [px, pt, pb] = LIMB_PAD;
  ctx.drawImage(limbPicture(w, root, seed), x - px, y - pt, w + px * 2, pt + pb);
  // A couple of vines hanging from under it, swaying.
  const depth = limbDepth(w, root, seed);
  ctx.save();
  ctx.lineCap = 'round';
  for (let j = 0; j < Math.max(1, Math.round(w / 320)); j++) {
    const u = 0.25 + 0.5 * h01(seed * 13 + j);
    const vx = x + u * w;
    const vy = y + depth(u) - 2;
    const len = 18 + h01(seed + j * 5) * 22;
    const sway = Math.sin(time * 1.1 + vx * 0.02) * 2 + windAt(time, vx + (wx ?? 0)) * 0.8;
    ctx.strokeStyle = TW.vine;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.quadraticCurveTo(vx + sway * 0.4, vy + len * 0.6, vx + sway, vy + len);
    ctx.stroke();
    ctx.fillStyle = TW.leaf;
    for (const q of [0.45, 0.8]) {
      ctx.beginPath();
      ctx.ellipse(vx + sway * q + (q > 0.6 ? 2.4 : -2.4), vy + len * q, 2.8, 1.4, q > 0.6 ? 0.5 : -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ========== The root chambers (rooms 2-6: under the trunk, in the tree's roots) ==========

// The roots: plum-brown like the ones at the Hollow Gate; the earth they hold, dark and soft.
export const RT = {
  root: '#8a5a6a', lit: '#b48494', sh: '#6a4252', deep: '#4e3040', groove: '#5a3848',
  earth: '#5a4038', earthLit: '#7a5a4a', earthSh: '#46302a', earthDeep: '#34221e', stone: '#8a7a74', stoneLit: '#aa9a92',
};

// ---- An earthen wall laced with roots, up one side of the chamber (`side` 0 west, 1 east). ----
function rootWallArt(side, rise) {
  const W = WALL_W;
  const h = rise + 3;
  return art(`rwall|${side}|${rise}`, W, h, () => {
    const out = [];
    const mir = (sh) => {
      if (!side) return sh;
      if (sh.pts) return { ...sh, pts: sh.pts.map(([px, py]) => [W - px, py]) };
      return { ...sh, x: W - sh.x };
    };
    const push = (...s) => out.push(...s.map(mir));
    const faceAt = (y) => WALL_FACE + 10 * Math.sin(y * 0.013 + side * 3) + 6 * Math.sin(y * 0.034 + 2);
    const body = [[-M, -M]];
    for (let y = -M; y <= h; y += 12) body.push([faceAt(y), y]);
    body.push([faceAt(h), h], [-M, h]);
    push(T(body, RT.earth));
    const strip = (d0, d1, c) => {
      const pts = [];
      for (let y = -M; y <= h; y += 12) pts.push([faceAt(y) - d0, y]);
      for (let y = h; y >= -M; y -= 12) pts.push([faceAt(y) - d1, y]);
      push(F(T(pts, c)));
    };
    strip(0, 6, RT.earthLit);
    strip(8, 16, RT.earthSh);
    // Faint layers in the earth.
    for (let y = 60; y < h; y += 70 + h01(y) * 40) {
      const pts = [];
      for (let x = -M; x <= WALL_FACE - 14; x += 14) pts.push([x, y + Math.sin(x * 0.04 + y) * 3]);
      push(F(band(pts, () => 1.4, RT.earthDeep)));
    }
    // Roots threading down through it, out over its face and back in.
    for (let k = 0; k < 3; k++) {
      const x0 = 30 + k * 34 + h01(k + side * 9) * 10;
      const pts = [];
      for (let y = -M; y <= h; y += 20) pts.push([x0 + Math.sin(y * 0.012 + k * 2) * (12 + k * 6), y]);
      const wd = 7 - k * 1.5;
      push(band(pts, () => wd, RT.root), F(band(pts.map(([x, y]) => [x - wd * 0.25, y]), () => wd * 0.3, RT.lit)));
    }
    // A couple of stones bedded in it.
    for (const [sy, sx] of [[h * 0.3, 0.45], [h * 0.75, 0.7]]) {
      const x = 16 + sx * (WALL_FACE - 40);
      push(E(x, sy, 11, 8, RT.stone), F(E(x - 3, sy - 3, 5, 2.6, RT.stoneLit)));
    }
    return out;
  });
}
function drawRootWall(ctx, x, y, time, seed) {
  // (`seed`: side + 2 x a height step, so a tall room's wall is tall enough: 0-1 low, 2-3 tall.)
  place(ctx, rootWallArt(seed % 2, seed >= 2 ? 1100 : 640), x, y);
}

// ---- The chamber's ceiling: earth with roots hanging down out of it. One stretch of it, 420 wide;
// rooms lay it end to end along their top. ----
const CEIL_W = 420;
const CEIL_H = 96;
function ceilingArt(seed) {
  return art(`ceil|${seed}`, CEIL_W, CEIL_H, () => {
    const out = [];
    const edge = (x) => 34 + 8 * Math.sin(x * 0.03 + seed) + 5 * Math.sin(x * 0.09 + seed * 2);
    const body = [[-M, -M], [CEIL_W + M, -M]];
    for (let x = CEIL_W + M; x >= -M; x -= 10) body.push([x, edge(x)]);
    out.push(T(body, RT.earth));
    const lower = [];
    for (let x = -M; x <= CEIL_W + M; x += 10) lower.push([x, edge(x) - 2]);
    out.push(F(band(lower, () => 4, RT.earthSh)));
    // Roots straggling down out of it: thin and long, wandering in loose waves, a little rootlet or
    // two off each, the tip curling (roots, not a row of stone spikes).
    for (let k = 0; k < 3; k++) {
      const x0 = 50 + k * 130 + h01(seed * 3 + k) * 70;
      const len = 44 + h01(seed + k * 7) * 60;
      const amp = 6 + h01(seed * 9 + k) * 4;
      const curl = h01(seed * 5 + k) > 0.5 ? 1 : -1;
      const pts = [];
      for (let q = 0; q <= 16; q++) {
        const u = q / 16;
        pts.push([x0 + Math.sin(u * 7 + k * 2.3 + seed) * amp * u + curl * 10 * u * u * u, edge(x0) - 6 + u * len]);
      }
      const wd = 3.6 + h01(k + seed) * 1.6;
      out.push(band(pts, (u) => wd * (1 - u * 0.45), RT.root), F(band(pts.map(([x, y]) => [x - 0.8, y]), (u) => wd * 0.3 * (1 - u * 0.5), RT.lit)));
      for (const q of [5, 10]) {
        const [bx, by] = pts[q];
        const sd = (q + k) % 2 ? 1 : -1;
        out.push(band([[bx, by], [bx + sd * 4, by + 3], [bx + sd * 7, by + 9], [bx + sd * 6, by + 14]], (u) => 1.6 * (1 - u * 0.5), RT.root));
      }
    }
    return out;
  });
}
function drawCeiling(ctx, x, y, time, seed) {
  place(ctx, ceilingArt(seed % 4), x, y);
}

// ---- A root pillar: a twisted bundle of roots from the floor up to what it holds (`rise`). ----
function pillarArt(rise) {
  const W = 90;
  const h = rise + 3;
  const cx = W / 2;
  return art(`rpillar|${rise}`, W, h, () => {
    const out = [];
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let q = 0; q <= 14; q++) {
        const u = q / 14;
        pts.push([cx + Math.sin(u * 6 + k * 2.1) * 7 + (k - 1) * 6, h - u * (rise + 6)]);
      }
      out.push(band(pts, (u) => (13 - k * 2) * (1 + 0.6 * Math.max(0, 0.15 - u) / 0.15), k === 1 ? RT.sh : RT.root));
      out.push(F(band(pts.map(([x, y]) => [x - 2.4, y]), () => 2.4, RT.lit)));
    }
    // Its foot spreading into the floor.
    for (const d of [-1, 1]) {
      const pts = [];
      for (let q = 0; q <= 6; q++) pts.push([cx + d * (6 + q * 5), h - 16 + q * 2.6]);
      out.push(band(pts, (u) => 8 * (1 - u * 0.6), RT.root));
    }
    return out;
  });
}

// ---- Capper's Garden's great mushroom: a fat pale stalk from the floor and a broad pink cap, flat on
// top (the middle ledge is its cap), a frill of gills under it and a few soft spots. ----
function capArt(rise, capW) {
  const W = capW + 40;
  const h = rise + 3;
  const cx = W / 2;
  return art(`gcap|${rise}|${capW}`, W, h, () => {
    const out = [];
    const top = h - rise;
    out.push(T([[cx - 26, h], [cx - 20, h - 40], [cx - 18, top + 40], [cx + 18, top + 40], [cx + 20, h - 40], [cx + 28, h]], '#f4e6dc'));
    out.push(F(T([[cx - 22, h], [cx - 17, h - 40], [cx - 15, top + 42], [cx - 6, top + 42], [cx - 8, h]], '#fff6ee')));
    out.push(F(T([[cx + 26, h], [cx + 18, h - 40], [cx + 16, top + 42], [cx + 10, top + 42], [cx + 12, h]], '#d8c4bc')));
    // The cap: flat on top, rounded at its rim, gills under it.
    const half = capW / 2;
    out.push(E(cx, top + 30, half, 12, '#c87aa8'));
    for (let k = -6; k <= 6; k++) out.push(F(T([[cx + k * half * 0.14, top + 30], [cx + k * half * 0.13, top + 40], [cx + k * half * 0.15 + 2, top + 40]], '#a85a88')));
    out.push(T([[cx - half - 4, top + 26], [cx - half + 6, top + 4], [cx - half + 22, top], [cx + half - 22, top], [cx + half - 6, top + 4], [cx + half + 4, top + 26], [cx + half - 10, top + 32], [cx - half + 10, top + 32]], '#ff9ec8'));
    out.push(F(T([[cx - half + 8, top + 6], [cx - half + 24, top + 2], [cx - 10, top + 2], [cx - 18, top + 9]], '#ffc8e0')));
    for (const [dx, dy, r] of [[-0.55, 16, 9], [-0.05, 20, 11], [0.48, 14, 8]]) out.push(F(E(cx + dx * half, top + dy, r, r * 0.55, '#fff0f6')));
    return out;
  });
}

export const ROOTROOM_KINDS = {
  rootwall: { w: WALL_W + M * 2, h: 1160, draw: drawRootWall },
  rootceiling: { w: CEIL_W + M * 2, h: CEIL_H + M, draw: drawCeiling },
  rootpillar: { w: 170, h: 480, draw: (ctx, x, y, time, seed) => place(ctx, pillarArt(280), x, y) },
  greatcap: { w: 320, h: 300, draw: (ctx, x, y) => place(ctx, capArt(220, 220), x, y) },
};

// ---------- Root shelves (`style: 'rootshelf'`) ----------

// A thick root lying level across the chamber: lit along its top, its bark lumpy, rootlets hanging
// from under it. A `root` end grows out of the wall (fading into it); a ledge marked `hang` hangs
// from two roots that come down from whatever is above it (the ledge above, or the ceiling), so it
// never floats.
const SHELF_KEPT = new Map();
const rootDepth = (w, root, seed) => (u) => {
  const fromRoot = root === 'left' ? u : root === 'right' ? 1 - u : 0.5 - Math.abs(u - 0.5);
  const base = root ? 24 - 10 * Math.pow(fromRoot, 0.8) : 15 + 4 * Math.sin(Math.PI * u);
  return base + 1.8 * Math.sin(u * w * 0.06 + seed) + 1.2 * Math.sin(u * w * 0.15 + seed * 2);
};
function paintRootShelf(g, w, root, seed) {
  const n = Math.max(8, Math.round(w / 10));
  const depth = rootDepth(w, root, seed);
  const rL = root === 'left';
  const rR = root === 'right';
  const pts = [];
  pts.push(rL ? [0, -1] : [5, -1]);
  pts.push(rR ? [w, -1] : [w - 5, -1]);
  if (!rR) pts.push([w + 1, depth(1) * 0.45]);
  for (let i = n; i >= 0; i--) pts.push([(i / n) * w, depth(i / n)]);
  if (!rL) pts.push([-1, depth(0) * 0.45]);
  const trace = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  };
  g.save();
  trace();
  g.fillStyle = RT.root;
  g.fill();
  g.clip();
  g.strokeStyle = RT.sh;
  g.lineWidth = 10;
  g.beginPath();
  for (let i = 0; i <= n; i++) g.lineTo((i / n) * w, depth(i / n) + 2);
  g.stroke();
  g.strokeStyle = RT.deep;
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i <= n; i++) g.lineTo((i / n) * w, depth(i / n) + 0.5);
  g.stroke();
  g.fillStyle = RT.lit;
  g.fillRect(-4, 1.5, w + 8, 2.6);
  g.strokeStyle = RT.groove;
  g.lineWidth = 1.1;
  for (const k of [0.4, 0.66]) {
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const y = 4 + (depth(u) - 5) * k + Math.sin(u * w * 0.09 + k * 7 + seed) * 1.2;
      if (i) g.lineTo(u * w, y);
      else g.moveTo(u * w, y);
    }
    g.stroke();
  }
  g.restore();
  trace();
  g.strokeStyle = shade(RT.root, -30);
  g.lineWidth = 1;
  g.stroke();
  // A free end curls down into a little rootlet.
  for (const d of [rR ? 0 : 1, rL ? 0 : -1]) {
    if (!d) continue;
    const tx = d > 0 ? w - 1 : 1;
    g.strokeStyle = RT.root;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(tx - 4 * d, depth(d > 0 ? 1 : 0) * 0.5);
    g.quadraticCurveTo(tx + 6 * d, 8, tx + 3 * d, 18);
    g.stroke();
  }
  if (rL || rR) {
    g.globalCompositeOperation = 'destination-out';
    const x0 = rL ? -2 : w + 2;
    const x1 = rL ? LIMB_FADE : w - LIMB_FADE;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.3, 'rgba(0,0,0,0.8)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(Math.min(x0, x1) - 1, -16, Math.abs(x1 - x0) + 2, 80);
    g.globalCompositeOperation = 'source-over';
  }
}
function rootShelfPicture(w, root, seed) {
  const key = `${w}|${root}|${seed}`;
  let c = SHELF_KEPT.get(key);
  if (!c) {
    const [px, pt, pb] = LIMB_PAD;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + px * 2) * LIMB_RES);
    c.height = Math.ceil((pt + pb) * LIMB_RES);
    const g = c.getContext('2d');
    g.scale(LIMB_RES, LIMB_RES);
    g.translate(px, pt);
    paintRootShelf(g, w, root, seed);
    SHELF_KEPT.set(key, c);
  }
  return c;
}
// (Where a hanging root comes down from: the underside of the nearest ledge above, or the ceiling.)
const hangFrom = (map, p, wx) => {
  let top = 20;
  for (const q of map?.platforms ?? []) {
    if (q === p || q.y >= p.y || wx < q.x || wx > q.x + q.w) continue;
    top = Math.max(top, q.y + 14);
  }
  return top;
};
export function drawRootShelf(ctx, x, y, w, time, seed, p, cam, map) {
  if (typeof document === 'undefined') return;
  x = snap(x);
  y = snap(y);
  // Held by one thick root: it comes down from what's above (the ledge above, or the ceiling) beside
  // one end, twisting as it goes, and curls into that end, so the shelf reads as that root turning
  // out sideways. (`hangSide` picks the end; otherwise it alternates.)
  if (p.hang) {
    const side = p.hangSide ?? (h01(seed * 2.7) > 0.5 ? 'left' : 'right');
    const d = side === 'left' ? -1 : 1;
    const endX = side === 'left' ? x + 10 : x + w - 10;
    const wx = endX + cam.x + d * 16;
    const top = hangFrom(map, p, wx) - cam.y;
    if (y - top > 10) {
      const hx = endX + d * 16;
      const len = y - top;
      const pts = [];
      for (let q = 0; q <= 18; q++) {
        const u = q / 18;
        // Down, twisting a little, then bending in toward the shelf's end in its last stretch.
        const wob = Math.sin(u * 5 + seed) * Math.min(6, len * 0.04) * (1 - u);
        const bend = u > 0.72 ? (u - 0.72) / 0.28 : 0;
        pts.push([hx + wob - d * 18 * bend * bend, top + len * u + bend * 4]);
      }
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [c, wd, ox] of [[RT.deep, 11, 0], [RT.root, 8.6, 0], [RT.lit, 2, -2.2]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = wd;
        ctx.beginPath();
        pts.forEach(([px2, py2], k) => (k ? ctx.lineTo(px2 + ox, py2) : ctx.moveTo(px2 + ox, py2)));
        ctx.stroke();
      }
      // A rootlet or two straying off it.
      ctx.strokeStyle = RT.root;
      ctx.lineWidth = 2;
      for (const u of [0.3, 0.55]) {
        const [rx, ry] = pts[Math.round(u * 18)];
        if (len < 60) break;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx + d * 8, ry + 3, rx + d * 10, ry + 12);
        ctx.stroke();
      }
      // (Where it turns into the shelf, a swelling knuckle of root.)
      ctx.fillStyle = RT.root;
      ctx.beginPath();
      ctx.ellipse(endX + d * 6, y + 4, 11, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
  const [px, pt, pb] = LIMB_PAD;
  ctx.drawImage(rootShelfPicture(w, p.root, seed), x - px, y - pt, w + px * 2, pt + pb);
  // A rootlet or two hanging under it.
  const depth = rootDepth(w, p.root, seed);
  ctx.save();
  ctx.lineCap = 'round';
  for (let j = 0; j < Math.max(1, Math.round(w / 260)); j++) {
    const u = 0.3 + 0.4 * h01(seed * 13 + j);
    const vx = x + u * w;
    const vy = y + depth(u) - 2;
    const len = 12 + h01(seed + j * 5) * 16;
    const sway = Math.sin(time * 0.8 + vx * 0.02) * 1.4;
    ctx.strokeStyle = RT.root;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.quadraticCurveTo(vx + sway * 0.4, vy + len * 0.6, vx + sway, vy + len);
    ctx.stroke();
  }
  ctx.restore();
}

// A root to climb (`look.ropes: 'root'`): a long root hanging straight down, lumpy, with little
// rootlets for handholds.
export function drawRootRope(ctx, r, cam) {
  const x = r.x - cam.x;
  const top = r.top - cam.y - 8;
  const bottom = r.bottom - cam.y;
  if (bottom <= top) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const [c, w, off] of [[RT.deep, 7, 0], [RT.root, 5, 0], [RT.lit, 1.4, -1.2]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    for (let y = top, q = 0; y <= bottom; y += 10, q++) {
      const px = x + Math.sin(q * 0.7 + r.x) * 1.2 + off;
      if (y === top) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = RT.root;
  ctx.lineWidth = 2;
  for (let y = top + 16, k = 0; y < bottom - 8; y += 26, k++) {
    const s = k % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + s * 5, y + 2, x + s * 6, y + 7);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- The painted backdrop of a root chamber ----------

// The far side of the chamber: dark earth, a web of old roots crossing it, a few great root columns
// in the dark, and the room's own glow (`look.glow`, low in the room or at `look.glowAt`).
export function drawPaintedRootRoom(ctx, t, cam, width, height, time, layerY, air, map) {
  const earth = mix('#3e2a2c', air, 0.15);
  const rootC = mix('#5a3848', air, 0.15);
  const rootLit = mix(rootC, t.glow ?? '#ffcf8a', 0.18);
  ctx.fillStyle = earth;
  ctx.fillRect(0, 0, width, height);
  // The room's glow.
  const glow = t.glow ?? '#ffcf8a';
  const [gwx, gwy] = t.glowAt ?? [(map?.width ?? width) / 2, map?.groundY ?? height];
  const gx = gwx - cam.x * 0.6;
  const gy = gwy - cam.y * 0.6;
  {
    const g = ctx.createRadialGradient(gx, gy, 20, gx, gy, 520);
    g.addColorStop(0, hexA(glow, 0.34));
    g.addColorStop(0.5, hexA(glow, 0.1));
    g.addColorStop(1, hexA(glow, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // Great root columns far back.
  repeat(cam.x, 0.25, 260, width, (i, x) => {
    if (h01(i * 3.3) < 0.35) return;
    const xx = x + h01(i + 2) * 80;
    const wd = 26 + h01(i + 5) * 22;
    ctx.fillStyle = mix(rootC, earth, 0.4);
    ctx.beginPath();
    ctx.moveTo(xx - wd / 2, -10);
    for (let y = -10; y <= height + 10; y += 30) ctx.lineTo(xx - wd / 2 + Math.sin(y * 0.01 + i) * 10, y);
    for (let y = height + 10; y >= -10; y -= 30) ctx.lineTo(xx + wd / 2 + Math.sin(y * 0.01 + i) * 10, y);
    ctx.closePath();
    ctx.fill();
  });
  // A web of roots crossing the far wall.
  ctx.lineCap = 'round';
  repeat(cam.x, 0.4, 180, width, (i, x) => {
    const y0 = (h01(i * 7.1) * 1.2 - 0.1) * height;
    const y1 = y0 + (h01(i * 2.3) - 0.5) * 220;
    const wd = 4 + h01(i + 11) * 6;
    ctx.strokeStyle = rootC;
    ctx.lineWidth = wd;
    ctx.beginPath();
    ctx.moveTo(x - 60, y0);
    ctx.bezierCurveTo(x + 20, y0 + 60, x + 90, y1 - 60, x + 200, y1);
    ctx.stroke();
    ctx.strokeStyle = rootLit;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - 60, y0 - wd * 0.3);
    ctx.bezierCurveTo(x + 20, y0 + 60 - wd * 0.3, x + 90, y1 - 60 - wd * 0.3, x + 200, y1 - wd * 0.3);
    ctx.stroke();
  });
  // Dark toward the top, under the ceiling.
  const g = ctx.createLinearGradient(0, 0, 0, height * 0.5);
  g.addColorStop(0, hexA('#140e14', 0.45));
  g.addColorStop(1, hexA('#140e14', 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}
